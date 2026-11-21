import {Component, inject} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {RouterLink} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ParameterService, PollingService} from '@shigde/core';

interface Snapshot {
  active_lobbies: number;
  active_peers: number;
  lobbies: {lobby_id: string; peers: number}[];
  version: string;
  relay: {
    traffic: RelayTraffic[];
    sessions: {tier: string; opened: number; closed: number; active: number}[];
  };
  recorder: RecorderStats | null;
  system: {
    sampled_at_unix_ms: number;
    cpu_usage_percent: number;
    memory_used_bytes: number;
    memory_total_bytes: number;
    network_received_bytes_per_second: number;
    network_transmitted_bytes_per_second: number;
    disk_read_bytes_per_second: number;
    disk_written_bytes_per_second: number;
    root_disk_used_bytes: number | null;
    root_disk_total_bytes: number | null;
    history: SystemHistoryPoint[];
  };
}

interface RelayTraffic {
  tier: string;
  role: string;
  announces_started: number;
  announces_ended: number;
  announced_bytes: number;
  viewers_opened: number;
  viewers_closed: number;
  active_viewers: number;
  subscriptions_opened: number;
  subscriptions_closed: number;
  active_subscriptions: number;
  fetches: number;
  bytes: number;
  frames: number;
  groups: number;
  datagrams: number;
  stale_bytes: number;
  stale_frames: number;
  stale_groups: number;
  stale_datagrams: number;
}

interface SystemHistoryPoint {
  sampled_at_unix_ms: number;
  cpu_usage_percent: number;
  memory_used_bytes: number;
  memory_total_bytes: number;
  network_received_bytes_per_second: number;
  network_transmitted_bytes_per_second: number;
  disk_read_bytes_per_second: number;
  disk_written_bytes_per_second: number;
}

interface RecorderStats {
  active_recordings: number;
  segments_written_total: number;
  bytes_written_total: number;
  segment_write_seconds_total: number;
  segment_write_operations_total: number;
  segment_processing_seconds_total: number;
  segment_processing_operations_total: number;
  segment_write_failures_total: number;
  recording_failures_total: number;
  prepare_seconds_total: number;
  prepare_operations_total: number;
  prepare_failures_total: number;
}

type ChartMetric = 'cpu_usage_percent' | 'memory_percent' |
  'network_received_bytes_per_second' | 'network_transmitted_bytes_per_second' |
  'disk_read_bytes_per_second' | 'disk_written_bytes_per_second';

type RelayRateMetric = 'fetches_per_second' | 'frames_per_second' |
  'groups_per_second' | 'datagrams_per_second';

interface RelayHistoryPoint {
  sampled_at_unix_ms: number;
  fetches_per_second: number;
  frames_per_second: number;
  groups_per_second: number;
  datagrams_per_second: number;
}

type RecorderRateMetric = 'bytes_per_second' | 'segments_per_second' |
  'write_latency_ms' | 'processing_latency_ms';

interface RecorderHistoryPoint {
  sampled_at_unix_ms: number;
  bytes_per_second: number;
  segments_per_second: number;
  write_latency_ms: number;
  processing_latency_ms: number;
}

interface RelayTotals {
  activeSessions: number;
  activeViewers: number;
  activeSubscriptions: number;
  transferredBytes: number;
  staleBytes: number;
  fetches: number;
  frames: number;
  groups: number;
  datagrams: number;
}
@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly relayCharts: {title: string; metric: RelayRateMetric}[] = [
    {title: 'Fetches', metric: 'fetches_per_second'},
    {title: 'Frames', metric: 'frames_per_second'},
    {title: 'Groups', metric: 'groups_per_second'},
    {title: 'Datagrams', metric: 'datagrams_per_second'}
  ];
  readonly recorderCharts: {title: string; metric: RecorderRateMetric}[] = [
    {title: 'Write throughput', metric: 'bytes_per_second'},
    {title: 'Segments written', metric: 'segments_per_second'},
    {title: 'Average disk write time', metric: 'write_latency_ms'},
    {title: 'Average segment processing time', metric: 'processing_latency_ms'}
  ];
  snapshot: Snapshot | null = null;
  relayHistory: RelayHistoryPoint[] = [];
  recorderHistory: RecorderHistoryPoint[] = [];
  updatedAt: Date | null = null;
  error = false;
  private readonly polling = inject(PollingService);
  private readonly pollKey = 'admin-monitoring';
  private readonly http = inject(HttpClient);
  private readonly params = inject(ParameterService);
  private previousRelaySample: {sampled_at_unix_ms: number; totals: RelayTotals} | null = null;
  private lastRelaySampleAt: number | null = null;
  private previousRecorderSample: {sampled_at_unix_ms: number; stats: RecorderStats} | null = null;
  private lastRecorderSampleAt: number | null = null;

  constructor() {
    this.polling.watch<Snapshot>({
      key: this.pollKey, intervalMs: 5000, requiresSession: true, batch: {resource: 'monitoring'},
      load: context => this.http.get<Snapshot>(`${this.params.API_PREFIX}/admin/monitoring`, {context})
    }).pipe(takeUntilDestroyed()).subscribe(state => {
      this.error = !!state.error;
      this.snapshot = state.data;
      this.updatedAt = state.updatedAt === null ? null : new Date(state.updatedAt);
      if (state.data && this.updatedAt) {
        const sampledAt = this.updatedAt.getTime();
        this.recordRelaySample(state.data, sampledAt);
        this.recordRecorderSample(state.data.recorder, sampledAt);
      }
    });
  }
  formatBytes(bytes: number | null | undefined): string {
    if (bytes == null) return 'Unavailable';
    if (bytes < 1000) return `${bytes.toFixed(0)} B`;
    const units = ['kB', 'MB', 'GB', 'TB'];
    let value = bytes / 1000;
    let unit = 0;
    while (value >= 1000 && unit < units.length - 1) {
      value /= 1000;
      unit++;
    }
    return `${value.toFixed(1)} ${units[unit]}`;
  }

  formatRate(bytesPerSecond: number): string {
    return `${this.formatBytes(bytesPerSecond)}/s`;
  }

  memoryPercent(used: number, total: number): number {
    return total > 0 ? (used / total) * 100 : 0;
  }

  chartPoints(metric: ChartMetric): string {
    const points = this.snapshot?.system.history ?? [];
    if (points.length === 0) return '';

    const values = points.map(point => this.metricValue(point, metric));
    const maxValue = this.chartMax(metric, points);
    const width = 600;
    const height = 160;
    const padding = 8;
    const windowMs = 10 * 60 * 1000;
    const newestTimestamp = points[points.length - 1].sampled_at_unix_ms;
    return values.map((value, index) => {
      const age = newestTimestamp - points[index].sampled_at_unix_ms;
      const position = 1 - Math.min(age, windowMs) / windowMs;
      const x = padding + position * (width - padding * 2);
      const y = height - padding - (Math.min(value, maxValue) / maxValue) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  relayTotals(traffic: RelayTraffic[], sessions: Snapshot['relay']['sessions']): RelayTotals {
    return {
      activeSessions: sessions.reduce((total, session) => total + session.active, 0),
      activeViewers: traffic.reduce((total, item) => total + item.active_viewers, 0),
      activeSubscriptions: traffic.reduce((total, item) => total + item.active_subscriptions, 0),
      transferredBytes: traffic.reduce((total, item) => total + item.bytes, 0),
      staleBytes: traffic.reduce((total, item) => total + item.stale_bytes, 0),
      fetches: traffic.reduce((total, item) => total + item.fetches, 0),
      frames: traffic.reduce((total, item) => total + item.frames, 0),
      groups: traffic.reduce((total, item) => total + item.groups, 0),
      datagrams: traffic.reduce((total, item) => total + item.datagrams, 0)
    };
  }

  relayRate(metric: RelayRateMetric): number {
    const latest = this.relayHistory[this.relayHistory.length - 1];
    return latest?.[metric] ?? 0;
  }

  relayChartPoints(metric: RelayRateMetric): string {
    const values = this.relayHistory.map(point => point[metric]);
    const timestamps = this.relayHistory.map(point => point.sampled_at_unix_ms);
    return this.toPolyline(values, timestamps, Math.max(1, ...values));
  }

  recorderRate(metric: RecorderRateMetric): number {
    const latest = this.recorderHistory[this.recorderHistory.length - 1];
    return latest?.[metric] ?? 0;
  }

  recorderRateLabel(metric: RecorderRateMetric): string {
    const value = this.recorderRate(metric);
    if (metric === 'bytes_per_second') return this.formatRate(value);
    if (metric === 'write_latency_ms' || metric === 'processing_latency_ms') return `${value.toFixed(2)} ms`;
    return `${value.toFixed(1)}/s`;
  }

  recorderChartPoints(metric: RecorderRateMetric): string {
    const values = this.recorderHistory.map(point => point[metric]);
    const timestamps = this.recorderHistory.map(point => point.sampled_at_unix_ms);
    return this.toPolyline(values, timestamps, Math.max(1, ...values));
  }

  recorderScaleLabel(metric: RecorderRateMetric): string {
    if (metric === 'bytes_per_second') return `Scale: 0–${this.formatRate(Math.max(1, ...this.recorderHistory.map(point => point.bytes_per_second)))}`;
    if (metric === 'write_latency_ms' || metric === 'processing_latency_ms') {
      const values = this.recorderHistory.map(point => point[metric]);
      return `Scale: 0–${Math.max(1, ...values).toFixed(1)} ms`;
    }
    return `Scale: 0–${Math.max(1, ...this.recorderHistory.map(point => point.segments_per_second)).toFixed(1)}/s`;
  }

  private recordRelaySample(snapshot: Snapshot, sampledAt: number): void {
    if (this.lastRelaySampleAt === sampledAt) return;
    this.lastRelaySampleAt = sampledAt;

    const totals = this.relayTotals(snapshot.relay.traffic, snapshot.relay.sessions);
    const previous = this.previousRelaySample;
    const elapsedSeconds = previous
      ? Math.max(0.001, (sampledAt - previous.sampled_at_unix_ms) / 1000)
      : 1;
    const rate = (current: number, before: number | undefined): number => {
      if (!previous) return 0;
      const delta = current >= (before ?? 0) ? current - (before ?? 0) : current;
      return delta / elapsedSeconds;
    };

    this.relayHistory = [...this.relayHistory, {
      sampled_at_unix_ms: sampledAt,
      fetches_per_second: rate(totals.fetches, previous?.totals.fetches),
      frames_per_second: rate(totals.frames, previous?.totals.frames),
      groups_per_second: rate(totals.groups, previous?.totals.groups),
      datagrams_per_second: rate(totals.datagrams, previous?.totals.datagrams)
    }].slice(-120);
    this.previousRelaySample = {sampled_at_unix_ms: sampledAt, totals};
  }

  private recordRecorderSample(stats: RecorderStats | null, sampledAt: number): void {
    if (!stats || this.lastRecorderSampleAt === sampledAt) return;
    this.lastRecorderSampleAt = sampledAt;
    const previous = this.previousRecorderSample;
    const elapsedSeconds = previous
      ? Math.max(0.001, (sampledAt - previous.sampled_at_unix_ms) / 1000)
      : 1;
    const delta = (current: number, before: number | undefined): number => {
      if (!previous) return 0;
      return current >= (before ?? 0) ? current - (before ?? 0) : current;
    };
    const operations = delta(stats.segment_write_operations_total, previous?.stats.segment_write_operations_total);
    const writeSeconds = delta(stats.segment_write_seconds_total, previous?.stats.segment_write_seconds_total);
    const processedSegments = delta(stats.segment_processing_operations_total, previous?.stats.segment_processing_operations_total);
    const processingSeconds = delta(stats.segment_processing_seconds_total, previous?.stats.segment_processing_seconds_total);
    this.recorderHistory = [...this.recorderHistory, {
      sampled_at_unix_ms: sampledAt,
      bytes_per_second: delta(stats.bytes_written_total, previous?.stats.bytes_written_total) / elapsedSeconds,
      segments_per_second: delta(stats.segments_written_total, previous?.stats.segments_written_total) / elapsedSeconds,
      write_latency_ms: operations > 0 ? (writeSeconds / operations) * 1000 : 0,
      processing_latency_ms: processedSegments > 0 ? (processingSeconds / processedSegments) * 1000 : 0
    }].slice(-120);
    this.previousRecorderSample = {sampled_at_unix_ms: sampledAt, stats};
  }

  private toPolyline(values: number[], timestamps: number[], maximum: number): string {
    if (values.length === 0) return '';
    const width = 600;
    const height = 160;
    const padding = 8;
    const windowMs = 10 * 60 * 1000;
    const newestTimestamp = timestamps[timestamps.length - 1];
    return values.map((value, index) => {
      const age = newestTimestamp - timestamps[index];
      const position = 1 - Math.min(age, windowMs) / windowMs;
      const x = padding + position * (width - padding * 2);
      const y = height - padding - (Math.min(value, maximum) / maximum) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  chartScaleLabel(metric: ChartMetric): string {
    if (metric === 'cpu_usage_percent' || metric === 'memory_percent') return 'Scale: 0–100%';
    const points = this.snapshot?.system.history ?? [];
    const maximum = this.chartMax(metric, points);
    return `Scale: 0–${this.formatRate(maximum)}`;
  }

  private metricValue(point: SystemHistoryPoint, metric: ChartMetric): number {
    if (metric === 'memory_percent') {
      return point.memory_total_bytes > 0
        ? (point.memory_used_bytes / point.memory_total_bytes) * 100
        : 0;
    }
    return point[metric];
  }

  private chartMax(metric: ChartMetric, points: SystemHistoryPoint[]): number {
    if (metric === 'cpu_usage_percent' || metric === 'memory_percent') return 100;
    const pairedMetric: ChartMetric = metric === 'network_received_bytes_per_second'
      ? 'network_transmitted_bytes_per_second'
      : metric === 'network_transmitted_bytes_per_second'
        ? 'network_received_bytes_per_second'
        : metric === 'disk_read_bytes_per_second'
          ? 'disk_written_bytes_per_second'
          : 'disk_read_bytes_per_second';
    const max = Math.max(0, ...points.flatMap(point => [
      this.metricValue(point, metric), this.metricValue(point, pairedMetric)
    ]));
    return max > 0 ? max : 1;
  }
}
