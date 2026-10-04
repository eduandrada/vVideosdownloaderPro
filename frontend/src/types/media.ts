export interface PlatformInfo {
  id: "youtube" | "instagram" | "tiktok" | "twitter" | "facebook" | "pinterest" | "generic";
  name: string;
  badge_color: string;
  hex_color: string;
}

export interface VideoFormat {
  format_id: string;
  quality_label: string;
  height: number;
  fps: number;
  ext: string;
  size_mb: number | null;
  has_audio: boolean;
  note: string;
  url?: string | null;
}

export interface AudioFormat {
  label: string;
  ext: string;
  bitrate: string;
  size_mb: number | null;
}

export interface ImageFormat {
  label: string;
  url: string;
  ext: string;
  width?: number;
  height?: number;
}

export interface MediaMetadata {
  title: string;
  uploader: string;
  duration: number;
  duration_formatted: string;
  thumbnail: string;
  platform: PlatformInfo;
  view_count?: number;
  upload_date?: string;
  video_formats: VideoFormat[];
  audio_formats: AudioFormat[];
  image_formats: ImageFormat[];
  is_direct_streamable: boolean;
}

export interface TaskProgress {
  id: string;
  status: "queued" | "analyzing" | "downloading" | "transcoding" | "completed" | "failed" | "not_found";
  progress: number;
  speed?: string;
  eta?: string;
  step?: string;
  message?: string;
  filename?: string;
  file_size?: number;
  error?: string | null;
}

export interface DownloadOptions {
  url: string;
  mode: "video" | "audio" | "image";
  format_id?: string;
  output_format?: string;
  bitrate?: string;
  preset?: string;
  trim_start?: number;
  trim_end?: number;
  title?: string;
}
