#!/usr/bin/env python3
"""
Test OpenAI transcription API consumption/cost against a sample audio file.

Setup:
    pip install openai --break-system-packages

Usage:
    python test_transcription_cost.py path/to/task1_sample.mp3
    python test_transcription_cost.py path/to/task1_sample.mp3 --model whisper-1
    python test_transcription_cost.py path/to/task1_sample.mp3 --model gpt-4o-transcribe

Run it once per sample task recording (task1/task2/task3) to build a
realistic per-attempt cost, since durations differ per task.
"""
import argparse
import time

from openai import OpenAI

# Per-minute pricing (USD) — verify against https://platform.openai.com/docs/pricing
# before using this for real budgeting; rates can change.
PER_MINUTE_RATES = {
    "whisper-1": 0.006,
    "gpt-4o-transcribe": 0.006,
    "gpt-4o-mini-transcribe": 0.003,
}

XAF_PER_USD = 569  # mid-August 2026 mid-market rate — update before relying on this


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("audio_file")
    parser.add_argument(
        "--model",
        default="gpt-4o-mini-transcribe",
        choices=list(PER_MINUTE_RATES.keys()),
    )
    args = parser.parse_args()

    client = OpenAI()  # reads OPENAI_API_KEY from env

    with open(args.audio_file, "rb") as f:
        t0 = time.time()
        resp = client.audio.transcriptions.create(
            model=args.model,
            file=f,
            # whisper-1 supports verbose_json, which returns `duration` directly.
            response_format="verbose_json" if args.model == "whisper-1" else "json",
        )
        elapsed = time.time() - t0

    duration_sec = getattr(resp, "duration", None)  # present for whisper-1 verbose_json
    usage = getattr(resp, "usage", None)  # present for gpt-4o-transcribe(-mini) responses

    print(f"Model: {args.model}")
    print(f"API call wall time: {elapsed:.2f}s")
    print(f"Transcript ({len(resp.text)} chars): {resp.text[:200]}{'...' if len(resp.text) > 200 else ''}")

    if duration_sec is not None:
        minutes = duration_sec / 60
        cost_usd = minutes * PER_MINUTE_RATES[args.model]
        print(f"Audio duration: {duration_sec:.1f}s ({minutes:.3f} min)")
        print(f"Estimated cost: ${cost_usd:.5f}  (~{cost_usd * XAF_PER_USD:.1f} FCFA)")
    else:
        print("No `duration` field returned by this model/format.")
        print("Get exact duration independently, e.g.:")
        print(f"  ffprobe -v error -show_entries format=duration -of csv=p=0 {args.audio_file}")
        print("Then: cost = (duration_seconds / 60) * rate_per_minute")

    if usage is not None:
        print(f"Token usage object (if you want the token-pricing view instead): {usage}")


if __name__ == "__main__":
    main()
