import mavoice from '../assets/mavoice.wav';

export default function MiiSound() {
  return (
    <audio controls src={mavoice} />
  );
}
