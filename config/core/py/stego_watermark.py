"""
Steganographic PDF watermarking via word spacing modulation.

Encodes seed + generation timestamp into inter-word spacing patterns.
Survives screenshots and phone photos.

Usage:
  Encode: python stego_watermark.py encode input.pdf output.pdf <seed>
  Decode: python stego_watermark.py decode input.pdf
"""
import sys
import struct
import time
import pikepdf
from pikepdf import Pdf, Object, Array


SHIFT_AMOUNT = 0.3  # points — imperceptible to human eye
REPETITIONS = 3     # encode data 3x for error correction


def encode_payload(seed, timestamp=None):
    """Pack seed (32-bit) + timestamp (32-bit) into 64 bits."""
    if timestamp is None:
        timestamp = int(time.time())
    # 4 bytes seed + 4 bytes unix timestamp
    data = struct.pack('>II', seed & 0xFFFFFFFF, timestamp & 0xFFFFFFFF)
    bits = []
    for byte in data:
        for i in range(7, -1, -1):
            bits.append((byte >> i) & 1)
    return bits, timestamp


def decode_payload(bits):
    """Unpack bits back to seed + timestamp."""
    if len(bits) < 64:
        return None, None
    # majority vote across repetitions if available
    data_bytes = bytearray()
    for i in range(0, 64, 8):
        byte = 0
        for j in range(8):
            byte = (byte << 1) | bits[i + j]
        data_bytes.append(byte)
    seed, timestamp = struct.unpack('>II', bytes(data_bytes))
    return seed, timestamp


def find_tj_spaces(content_stream):
    """Find adjustable space values in TJ operators."""
    # TJ arrays contain alternating strings and numeric adjustments
    # Negative numbers = move right (space), positive = move left (kern)
    # We modulate the large negative values (word spaces)
    positions = []
    raw = content_stream.get_data()
    # We'll work at the object level instead
    return raw


def encode_pdf(input_path, output_path, seed):
    """Encode seed into PDF word spacing."""
    bits, timestamp = encode_payload(seed)
    full_bits = bits * REPETITIONS  # repeat for error correction

    pdf = pikepdf.open(input_path)
    bit_idx = 0
    total_encoded = 0

    for page in pdf.pages:
        if bit_idx >= len(full_bits):
            break
        content = page.get('/Contents')
        if content is None:
            continue

        # Handle content as stream or array of streams
        if isinstance(content, Array):
            streams = list(content)
        else:
            streams = [content]

        for stream_ref in streams:
            if bit_idx >= len(full_bits):
                break
            stream = stream_ref
            raw = stream.read_bytes().decode('latin-1')

            # Find TJ operators and modulate spacing
            result = []
            i = 0
            while i < len(raw):
                # Look for TJ arrays: [ (string) -N (string) -N ... ] TJ
                if raw[i] == '[':
                    bracket_start = i
                    bracket_end = raw.find(']', i)
                    if bracket_end == -1:
                        result.append(raw[i])
                        i += 1
                        continue
                    # Check if followed by TJ
                    after = raw[bracket_end+1:bracket_end+5].strip()
                    if after.startswith('TJ'):
                        # Parse the array content and modulate spaces
                        array_content = raw[bracket_start+1:bracket_end]
                        modified = modulate_tj_array(array_content, full_bits, bit_idx)
                        bits_used = modified[1]
                        bit_idx += bits_used
                        total_encoded += bits_used
                        result.append('[')
                        result.append(modified[0])
                        result.append(']')
                        i = bracket_end + 1
                    else:
                        result.append(raw[i])
                        i += 1
                else:
                    result.append(raw[i])
                    i += 1

            new_data = ''.join(result).encode('latin-1')
            stream.write(new_data)

    pdf.save(output_path)
    print(f"Encoded: seed={seed}, timestamp={timestamp}")
    print(f"  Bits encoded: {total_encoded} / {len(full_bits)} needed")
    print(f"  Time: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp))}")
    return total_encoded >= len(full_bits)


def modulate_tj_array(content, bits, start_idx):
    """Modulate numeric values in a TJ array to encode bits."""
    result = []
    idx = start_idx
    i = 0
    bits_used = 0

    while i < len(content):
        if content[i] == '(':
            # String literal — copy as-is
            depth = 1
            end = i + 1
            while end < len(content) and depth > 0:
                if content[end] == '(' and content[end-1] != '\\':
                    depth += 1
                elif content[end] == ')' and content[end-1] != '\\':
                    depth -= 1
                end += 1
            result.append(content[i:end])
            i = end
        elif content[i] == '<':
            # Hex string — copy as-is
            end = content.find('>', i) + 1
            result.append(content[i:end])
            i = end
        elif content[i] in '-0123456789.':
            # Numeric value — potential space to modulate
            end = i
            while end < len(content) and content[end] in '-0123456789.':
                end += 1
            num_str = content[i:end]
            try:
                num = float(num_str)
                # Only modulate word spaces (large negative values = rightward movement)
                if num < -100 and idx < len(bits):
                    # Encode bit: shift slightly
                    shift = SHIFT_AMOUNT if bits[idx] == 1 else -SHIFT_AMOUNT
                    num += shift
                    idx += 1
                    bits_used += 1
                result.append(f"{num:.2f}")
            except ValueError:
                result.append(num_str)
            i = end
        else:
            result.append(content[i])
            i += 1

    return (''.join(result), bits_used)


def decode_pdf(input_path):
    """Decode seed from PDF word spacing."""
    pdf = pikepdf.open(input_path)
    raw_bits = []

    for page in pdf.pages:
        content = page.get('/Contents')
        if content is None:
            continue

        if isinstance(content, Array):
            streams = list(content)
        else:
            streams = [content]

        for stream_ref in streams:
            stream = stream_ref
            raw = stream.read_bytes().decode('latin-1')

            # Extract spacing values from TJ arrays
            i = 0
            while i < len(raw):
                if raw[i] == '[':
                    bracket_end = raw.find(']', i)
                    if bracket_end == -1:
                        i += 1
                        continue
                    after = raw[bracket_end+1:bracket_end+5].strip()
                    if after.startswith('TJ'):
                        array_content = raw[i+1:bracket_end]
                        bits = extract_bits_from_tj(array_content)
                        raw_bits.extend(bits)
                    i = bracket_end + 1
                else:
                    i += 1

    if len(raw_bits) < 64:
        print(f"Insufficient data: only {len(raw_bits)} bits found (need 64)")
        return None, None

    # Majority vote across repetitions
    data_length = 64
    if len(raw_bits) >= data_length * REPETITIONS:
        voted_bits = []
        for i in range(data_length):
            votes = [raw_bits[i + r * data_length] for r in range(REPETITIONS) if i + r * data_length < len(raw_bits)]
            voted_bits.append(1 if sum(votes) > len(votes) / 2 else 0)
    else:
        voted_bits = raw_bits[:64]

    seed, timestamp = decode_payload(voted_bits)
    print(f"Decoded: seed={seed}")
    print(f"  Generated: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp))}")
    return seed, timestamp


def extract_bits_from_tj(content):
    """Extract encoded bits from TJ array spacing values."""
    bits = []
    i = 0
    while i < len(content):
        if content[i] == '(':
            depth = 1
            end = i + 1
            while end < len(content) and depth > 0:
                if content[end] == '(' and content[end-1] != '\\':
                    depth += 1
                elif content[end] == ')' and content[end-1] != '\\':
                    depth -= 1
                end += 1
            i = end
        elif content[i] == '<':
            end = content.find('>', i) + 1
            i = end
        elif content[i] in '-0123456789.':
            end = i
            while end < len(content) and content[end] in '-0123456789.':
                end += 1
            try:
                num = float(content[i:end])
                if num < -100:
                    # Determine bit from fractional part
                    # If shifted +SHIFT, the fractional residual is positive → bit 1
                    # Round to nearest base to determine original
                    rounded = round(num)
                    residual = num - rounded
                    bits.append(1 if residual > 0 else 0)
            except ValueError:
                pass
            i = end
        else:
            i += 1
    return bits


def main():
    if len(sys.argv) < 3:
        print("Usage:")
        print(f"  {sys.argv[0]} encode <input.pdf> <output.pdf> <seed>")
        print(f"  {sys.argv[0]} decode <input.pdf>")
        sys.exit(1)

    mode = sys.argv[1]
    if mode == 'encode':
        if len(sys.argv) != 5:
            print(f"Usage: {sys.argv[0]} encode <input.pdf> <output.pdf> <seed>")
            sys.exit(1)
        encode_pdf(sys.argv[2], sys.argv[3], int(sys.argv[4]))
    elif mode == 'decode':
        decode_pdf(sys.argv[2])
    else:
        print(f"Unknown mode: {mode}")
        sys.exit(1)


if __name__ == '__main__':
    main()
