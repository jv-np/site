import { Code } from "../Code";

export default function VoxCPMRs() {
  const code = `
  use voxcpm_rs::{audio, GenerateOptions, VoxCPM};

  type B = burn::backend::Wgpu<f32, i32>;

  fn main() -> anyhow::Result<()> {
      let device = Default::default();
      // Load once — takes ~20–25 s for the full model on a modern GPU.
      // Subsequent \`generate()\` calls reuse the same loaded model.
      let model: VoxCPM<B> = VoxCPM::from_local("./VoxCPM2", &device)?;

      let wav_1 = model.generate("First sentence.",  GenerateOptions::default())?;
      let wav_2 = model.generate("Second sentence.", GenerateOptions::default())?;

      audio::write_wav("out1.wav", &wav_1, model.sample_rate())?;
      audio::write_wav("out2.wav", &wav_2, model.sample_rate())?;
      Ok(())
  }
  `;

  return (
    <div>
      <div className="sc-preview">
        <span className="sc-dot" />
        <span className="sc-label">voxcpm-rs-example</span>
        <span className="sc-hint mono">▶ expand to see</span>
      </div>
      <div className="sc-full">
        <Code lang="rust">{code}</Code>
      </div>
    </div>
  );
}
