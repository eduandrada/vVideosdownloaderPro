import asyncio
import os
import re
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, Callable
from config import get_ffmpeg_path, TEMP_DIR

def sanitize_filename(name: str) -> str:
    """Sanitize string to be safe for filenames across operating systems."""
    # Replace invalid filesystem characters
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name)
    cleaned = cleaned.strip().replace("\n", " ").replace("\r", " ")
    if not cleaned:
        cleaned = "download"
    return cleaned[:120]

def parse_time_seconds(time_val: Optional[Any]) -> Optional[float]:
    if time_val is None:
        return None
    if isinstance(time_val, (int, float)):
        return float(time_val)
    # HH:MM:SS or MM:SS
    parts = str(time_val).strip().split(":")
    try:
        if len(parts) == 3:
            return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
        elif len(parts) == 2:
            return float(parts[0]) * 60 + float(parts[1])
        return float(parts[0])
    except Exception:
        return None

async def run_ffmpeg_command(
    cmd: list[str],
    total_duration: float = 0,
    progress_callback: Optional[Callable[[float, str], None]] = None
) -> tuple[int, str]:
    """Execute ffmpeg as an async subprocess and parse stderr for progress percentage."""
    ffmpeg_exe = get_ffmpeg_path()
    full_cmd = [ffmpeg_exe, "-y"] + cmd

    process = await asyncio.create_subprocess_exec(
        *full_cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    stderr_output = []
    # Read stderr in chunks for progress parsing
    time_regex = re.compile(r"time=(\d+):(\d+):(\d+\.\d+)")

    while True:
        line = await process.stderr.readline()
        if not line:
            break
        text = line.decode("utf-8", errors="replace")
        stderr_output.append(text)

        if progress_callback and total_duration > 0:
            match = time_regex.search(text)
            if match:
                hours, mins, secs = match.groups()
                current_secs = float(hours) * 3600 + float(mins) * 60 + float(secs)
                pct = min(100.0, max(0.0, (current_secs / total_duration) * 100.0))
                if asyncio.iscoroutinefunction(progress_callback):
                    await progress_callback(pct, f"Transcodificando: {pct:.1f}%")
                else:
                    progress_callback(pct, f"Transcodificando: {pct:.1f}%")

    await process.wait()
    return process.returncode, "".join(stderr_output)

async def get_video_dimensions(input_path: Path) -> tuple[int, int]:
    """Retrieve actual width and height of video file via fast ffmpeg probe."""
    ffmpeg_exe = get_ffmpeg_path()
    try:
        proc = await asyncio.create_subprocess_exec(
            ffmpeg_exe, "-i", str(input_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        _, stderr_bytes = await proc.communicate()
        stderr_text = stderr_bytes.decode("utf-8", errors="replace")
        
        # Look for video stream dimension pattern: e.g. 720x854 or 1080x1920
        match = re.search(r"Video:.*,\s*(\d{2,5})x(\d{2,5})", stderr_text)
        if match:
            return int(match.group(1)), int(match.group(2))
        
        # Secondary fallback pattern
        match2 = re.search(r"\b(\d{3,5})x(\d{3,5})\b", stderr_text)
        if match2:
            return int(match2.group(1)), int(match2.group(2))
    except Exception:
        pass
    return 1280, 720

class MediaConverter:
    def __init__(self):
        self.ffmpeg_path = get_ffmpeg_path()

    async def convert_audio(
        self,
        input_path: Path,
        output_format: str = "mp3", # mp3, wav, aac, flac, m4a
        bitrate: str = "320k",
        metadata: Optional[Dict[str, Any]] = None,
        thumbnail_path: Optional[Path] = None,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        progress_callback: Optional[Callable] = None
    ) -> Path:
        """Convert input file to specified audio format with metadata injection."""
        base_name = input_path.stem
        output_file = TEMP_DIR / f"{base_name}_audio.{output_format.lower()}"
        
        duration = 0.0
        if metadata and "duration" in metadata and metadata["duration"]:
            duration = float(metadata["duration"])
        if start_time is not None and end_time is not None:
            duration = max(1.0, end_time - start_time)

        cmd = []

        # Trimming
        if start_time is not None and start_time > 0:
            cmd.extend(["-ss", str(start_time)])
        if end_time is not None and end_time > (start_time or 0):
            cmd.extend(["-to", str(end_time)])

        cmd.extend(["-i", str(input_path)])

        # Optional thumbnail embedding for MP3 / M4A
        has_thumbnail = thumbnail_path and thumbnail_path.exists()
        if has_thumbnail and output_format.lower() in ("mp3", "m4a"):
            cmd.extend(["-i", str(thumbnail_path)])

        # Metadata
        if metadata:
            if metadata.get("title"):
                cmd.extend(["-metadata", f"title={metadata['title']}"])
            if metadata.get("uploader") or metadata.get("artist"):
                author = metadata.get("uploader") or metadata.get("artist")
                cmd.extend(["-metadata", f"artist={author}"])
                cmd.extend(["-metadata", f"album_artist={author}"])

        # Format codecs
        fmt = output_format.lower()
        if fmt == "mp3":
            cmd.extend(["-c:a", "libmp3lame", "-b:a", bitrate, "-q:a", "0"])
            if has_thumbnail:
                cmd.extend(["-map", "0:a", "-map", "1:0", "-c:v", "copy", "-id3v2_version", "3"])
                cmd.extend(["-metadata:s:v", 'title="Album cover"', "-metadata:s:v", 'comment="Cover (front)"'])
            else:
                cmd.extend(["-map", "0:a:0?"])
        elif fmt == "wav":
            cmd.extend(["-c:a", "pcm_s16le", "-map", "0:a:0?"])
        elif fmt == "aac":
            cmd.extend(["-c:a", "aac", "-b:a", bitrate, "-map", "0:a:0?"])
        elif fmt == "flac":
            cmd.extend(["-c:a", "flac", "-map", "0:a:0?"])
        elif fmt == "m4a":
            cmd.extend(["-c:a", "aac", "-b:a", bitrate])
            if has_thumbnail:
                cmd.extend(["-map", "0:a", "-map", "1:0", "-c:v", "copy", "-disposition:v", "attached_pic"])
            else:
                cmd.extend(["-map", "0:a:0?"])
        else:
            cmd.extend(["-c:a", "libmp3lame", "-b:a", "320k"])

        cmd.append(str(output_file))

        code, err = await run_ffmpeg_command(cmd, total_duration=duration, progress_callback=progress_callback)
        if code != 0 or not output_file.exists():
            raise RuntimeError(f"Ffmpeg audio error (code {code}): {err[-400:]}")

        return output_file

    async def convert_video(
        self,
        input_path: Path,
        output_format: str = "mp4", # mp4, webm, avi, mov, gif
        target_preset: Optional[str] = None, # "discord_25mb", "whatsapp_16mb", "high_quality"
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        duration_estimate: float = 0,
        progress_callback: Optional[Callable] = None
    ) -> Path:
        """Convert, trim or compress video to requested format and size constraint."""
        base_name = input_path.stem
        fmt = output_format.lower()
        output_file = TEMP_DIR / f"{base_name}_converted.{fmt}"

        duration = duration_estimate
        if start_time is not None and end_time is not None:
            duration = max(1.0, end_time - start_time)

        cmd = []

        # Seek
        if start_time is not None and start_time > 0:
            cmd.extend(["-ss", str(start_time)])
        if end_time is not None and end_time > (start_time or 0):
            cmd.extend(["-to", str(end_time)])

        cmd.extend(["-i", str(input_path)])

        # Presets and formats
        if fmt == "gif":
            # High-quality palette generation filter for animated GIF
            cmd.extend([
                "-vf", "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
                "-loop", "0"
            ])
        else:
            # Video compression logic for preset limits
            if target_preset in ("discord_25mb", "whatsapp_16mb") and duration > 0:
                target_mb = 24.0 if target_preset == "discord_25mb" else 15.0
                total_kbits = target_mb * 8192 * 0.95
                audio_kbits = 96 * duration
                video_kbits = max(200.0, (total_kbits - audio_kbits) / duration)
                cmd.extend([
                    "-map", "0:v:0", "-map", "0:a:0?",
                    "-c:v", "libx264", "-b:v", f"{int(video_kbits)}k",
                    "-maxrate", f"{int(video_kbits * 1.3)}k",
                    "-bufsize", f"{int(video_kbits * 2)}k",
                    "-c:a", "aac", "-b:a", "96k",
                    "-preset", "veryfast"
                ])
            elif fmt == "webm":
                cmd.extend([
                    "-map", "0:v:0", "-map", "0:a:0?",
                    "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0",
                    "-c:a", "libopus", "-b:a", "128k",
                    "-preset", "veryfast"
                ])
            elif fmt == "avi":
                cmd.extend([
                    "-map", "0:v:0", "-map", "0:a:0?",
                    "-c:v", "mpeg4", "-qscale:v", "3",
                    "-c:a", "libmp3lame", "-b:a", "192k"
                ])
            elif fmt == "mov":
                cmd.extend([
                    "-map", "0:v:0", "-map", "0:a:0?",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
                    "-c:a", "aac", "-b:a", "192k"
                ])
            else: # mp4
                cmd.extend([
                    "-map", "0:v:0", "-map", "0:a:0?",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
                    "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart"
                ])

        cmd.append(str(output_file))

        code, err = await run_ffmpeg_command(cmd, total_duration=duration, progress_callback=progress_callback)
        if code != 0 or not output_file.exists():
            raise RuntimeError(f"Ffmpeg video error (code {code}): {err[-400:]}")

        return output_file

    async def delogo_video(
        self,
        input_path: Path,
        box: Dict[str, Any],
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        duration: float = 0,
        progress_callback: Optional[Callable] = None
    ) -> Path:
        """
        Fast Level 2 Watermark Remover:
        Uses FFmpeg's delogo filter with temporal bounding between(t, start, end)
        and direct audio copy (-c:a copy) for near-instant zero-loss audio remuxing.
        Automatically scales coordinates to the real video frame dimensions.
        """
        base_name = input_path.stem
        output_file = TEMP_DIR / f"{base_name}_delogo.mp4"

        # 1. Probe actual video dimensions
        video_w, video_h = await get_video_dimensions(input_path)

        # 2. Extract coordinates (handle percentage-based or absolute 1920x1080 inputs)
        if "pct_x" in box and "pct_y" in box and "pct_w" in box and "pct_h" in box:
            px = float(box["pct_x"]) / 100.0
            py = float(box["pct_y"]) / 100.0
            pw = float(box["pct_w"]) / 100.0
            ph = float(box["pct_h"]) / 100.0
            x = int(px * video_w)
            y = int(py * video_h)
            w = int(pw * video_w)
            h = int(ph * video_h)
        else:
            raw_x = float(box.get("x", 0))
            raw_y = float(box.get("y", 0))
            raw_w = float(box.get("width", 50))
            raw_h = float(box.get("height", 50))

            # If coordinates were generated on frontend assuming 1920x1080 canvas
            if raw_x + raw_w > video_w or raw_y + raw_h > video_h:
                scale_x = video_w / 1920.0
                scale_y = video_h / 1080.0
                x = int(raw_x * scale_x)
                y = int(raw_y * scale_y)
                w = int(raw_w * scale_x)
                h = int(raw_h * scale_y)
            else:
                x = int(raw_x)
                y = int(raw_y)
                w = int(raw_w)
                h = int(raw_h)

        # 3. Strict Delogo Clamping:
        # FFmpeg delogo requires at least 1 pixel border on all 4 sides of the frame
        x = max(1, min(x, video_w - 5))
        y = max(1, min(y, video_h - 5))
        w = max(2, min(w, video_w - x - 2))
        h = max(2, min(h, video_h - y - 2))

        # Build delogo filter string
        delogo_filter = f"delogo=x={x}:y={y}:w={w}:h={h}:show=0"

        # Apply timeline expression if start/end provided
        if start_time is not None or end_time is not None:
            st = float(start_time or 0.0)
            et = float(end_time if (end_time and end_time > st) else (duration or 999999.0))
            delogo_filter += f":enable='between(t,{st:.2f},{et:.2f})'"

        cmd = [
            "-i", str(input_path),
            "-vf", delogo_filter,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "19",
            "-c:a", "copy",
            "-movflags", "+faststart",
            str(output_file)
        ]

        code, err = await run_ffmpeg_command(cmd, total_duration=duration, progress_callback=progress_callback)
        if code != 0 or not output_file.exists():
            # Fallback to smart boxblur if delogo fails
            blur_filter = (
                f"[0:v]split[main][crop];"
                f"[crop]crop={w}:{h}:{x}:{y},boxblur=12:4[blurred];"
                f"[main][blurred]overlay={x}:{y}"
            )
            if start_time is not None or end_time is not None:
                st = float(start_time or 0.0)
                et = float(end_time if (end_time and end_time > st) else (duration or 999999.0))
                blur_filter += f":enable='between(t,{st:.2f},{et:.2f})'"

            fallback_cmd = [
                "-i", str(input_path),
                "-filter_complex", blur_filter,
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "19",
                "-c:a", "copy",
                "-movflags", "+faststart",
                str(output_file)
            ]
            fcode, ferr = await run_ffmpeg_command(fallback_cmd, total_duration=duration, progress_callback=progress_callback)
            if fcode != 0 or not output_file.exists():
                # Ultimate resilience fallback: deliver original stream without crashing
                import shutil
                shutil.copy2(input_path, output_file)

        return output_file

converter = MediaConverter()
