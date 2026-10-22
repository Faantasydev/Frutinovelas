"""Optional Spanish speech generation through the local Kokoro package."""
import sys

def main():
    try:
        from kokoro import KPipeline
        import soundfile as sf
    except ImportError as exc:
        raise SystemExit(f"Falta una dependencia de Kokoro: {exc}. Consulta docs/KOKORO.md")
    text, output, voice = sys.argv[1:4]
    pipeline = KPipeline(lang_code='e')
    chunks = [audio for _, _, audio in pipeline(text, voice=voice)]
    if not chunks:
        raise SystemExit('Kokoro no generó audio.')
    import numpy as np
    sf.write(output, np.concatenate(chunks), 24000)

if __name__ == '__main__':
    main()
