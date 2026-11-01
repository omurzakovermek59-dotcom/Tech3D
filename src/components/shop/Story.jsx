import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/language.jsx';

function StoryStep({ label, title, description, index, active }) {
  return <article className={`step${active ? ' on' : ''}`} data-s={index}>
    <small>{label}</small><h2>{title}</h2><p>{description}</p>
  </article>;
}

function PhonePreview({ step, t }) {
  return <div className="stage" data-step={step}>
    <div className="phone">
      <div className="scr s1"><div className="sw"><i style={{ '--c': '#ff7a3d' }} /><i style={{ '--c': '#22e4ff' }} /><i style={{ '--c': '#b6ff3c' }} /><i style={{ '--c': '#ff3fd0' }} /></div><p>{t('story.color')}</p></div>
      <div className="scr s2"><div className="bars"><i style={{ '--w': '30%' }}>128</i><i style={{ '--w': '55%' }}>256</i><i style={{ '--w': '80%' }}>512</i><i style={{ '--w': '100%' }}>1ТБ</i></div><p>{t('story.memory')}</p></div>
      <div className="scr s3"><div className="ok">✓</div><p>{t('story.sent')}</p></div>
    </div>
  </div>;
}

export default function Story() {
  const [step, setStep] = useState('1');
  const { t } = useLanguage();
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) setStep(entry.target.dataset.s);
    }), { rootMargin: '-45% 0px -45% 0px' });
    document.querySelectorAll('.step').forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, []);
  const steps = [1, 2, 3].map(index => [
    t(`story.${index}.label`),
    t(`story.${index}.title`),
    t(`story.${index}.text`)
  ]);
  return <section className="story" id="story">
    <div className="story-text">{steps.map(([label, title, description], index) => <StoryStep key={title} label={label} title={title} description={description} index={index + 1} active={step === String(index + 1)} />)}</div>
    <PhonePreview step={step} t={t} />
  </section>;
}
