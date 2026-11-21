# Composition Studio bass samples

Source: Synth Chris / lotkey, Schecter Diamond Series Elite-5 bass.
https://github.com/lotkey/free-sample-libraries-sfz

Converted from the 40 WAV files supplied locally by the user on 29 October 2026.
The original Bass.sfz is retained as the source mapping reference. Its five
pitch centres, two velocity layers and four round-robin takes are preserved.
Sharp filenames use `s` to simplify URLs. The SFZ itself is a reference, not
loaded by the browser.

Web copies: mono AAC-LC, 80 kb/s, 32 kHz, complete original duration.
Processing: 20 Hz high-pass filter and 2 ms attack fade to reduce DC/subsonic
noise and onset clicks. Playback adds a 4 ms attack and 100 ms release.
Source WAV files remain unchanged in Downloads.

Conversion used FFmpeg: -af highpass=f=20,afade=t=in:d=0.002 -ac 1 -ar 32000
-c:a aac -b:a 80k -movflags +faststart.

Bass playback scales incoming velocity to 85% before choosing the sample layer
and setting its gain, softening the default accompaniment and keyboard preview.
