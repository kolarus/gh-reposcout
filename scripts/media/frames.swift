// `swift scripts/media/frames.swift <video> <out dir> <fps> <width>`: extracts
// frames from a video at a fixed rate, scaled to `width` pixels, as numbered
// PNGs (`yarn media:android`, ADR-0021). AVFoundation ships with macOS, so the
// demo GIF needs no ffmpeg.
import AVFoundation
import AppKit

let args = CommandLine.arguments
guard args.count == 5, let fps = Double(args[3]), let width = Double(args[4]) else {
  FileHandle.standardError.write("usage: frames.swift <video> <out dir> <fps> <width>\n".data(using: .utf8)!)
  exit(2)
}
let outDir = URL(fileURLWithPath: args[2])
try FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
generator.maximumSize = CGSize(width: width, height: width * 10)

let duration = try await asset.load(.duration).seconds
var index = 0
for time in stride(from: 0.0, to: duration, by: 1 / fps) {
  let (image, _) = try await generator.image(at: CMTime(seconds: time, preferredTimescale: 600))
  let png = NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])!
  try png.write(to: outDir.appendingPathComponent(String(format: "frame-%04d.png", index)))
  index += 1
}
print("\(index) frames, \(String(format: "%.1f", duration)) s")
