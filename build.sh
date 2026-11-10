#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$DIR/MegaMod_1.26.62.1.mcaddon"

python3 -c "
import os, zipfile

base_dir = '$DIR'
output_path = '$OUTPUT'

if os.path.exists(output_path):
    os.remove(output_path)

with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for folder in ['BP', 'RP']:
        full_folder = os.path.join(base_dir, folder)
        for root, _, files in os.walk(full_folder):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, base_dir)
                z.write(file_path, arcname)

print(f'[+] Paket olusturuldu: {output_path}')
"
