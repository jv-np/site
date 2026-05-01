import { Code } from '../Code';
import { ShowcaseFrame } from './ShowcaseFrame';

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
    <ShowcaseFrame label="voxcpm-rs-example" hint="▶ expand to see">
      <Code lang="rust">{code}</Code>
    </ShowcaseFrame>
  );
}
