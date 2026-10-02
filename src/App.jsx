import { useEffect, useMemo, useRef, useState } from 'react'

// 17 October 2026, 00:00 India Standard Time
const TARGET = new Date('2026-10-17T00:00:00+05:30').getTime()
const INTRO_FADE_MS = 700

const calc = () => {
  const d = Math.max(0, TARGET - Date.now())
  return {
    done: d === 0,
    days: Math.floor(d / 864e5),
    hours: Math.floor(d / 36e5) % 24,
    minutes: Math.floor(d / 6e4) % 60,
    seconds: Math.floor(d / 1e3) % 60,
  }
}
const pad = (n) => String(n).padStart(2, '0')
const rnd = (a, b) => a + Math.random() * (b - a)

function Particles({ n = 34, burst = false }) {
  const items = useMemo(
    () => Array.from({ length: n }, () => ({
      '--x': `${rnd(0, 100)}%`, '--s': `${rnd(2, burst ? 6 : 4)}px`,
      '--d': `${rnd(burst ? 2.5 : 9, burst ? 5 : 20)}s`, '--l': `${rnd(0, burst ? 1.5 : 14)}s`,
      '--dx': `${rnd(-60, 60)}px`,
    })), [n, burst])
  return <div className={burst ? 'sparks burst' : 'sparks'} aria-hidden="true">{items.map((s, i) => <i key={i} style={s} />)}</div>
}

export default function App() {
  const [t, setT] = useState(calc)
  const [phase, setPhase] = useState('video')
  const [isFading, setIsFading] = useState(false)
  const [introProgress, setIntroProgress] = useState(0)
  const [introPlaying, setIntroPlaying] = useState(false)
  const videoRef = useRef(null)
  const videoWatchdogRef = useRef(null)
  const fadeStartedRef = useRef(false)

  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (phase !== 'video') return

    videoWatchdogRef.current = setTimeout(() => setPhase('fallback'), 12000)
    const playRequest = videoRef.current?.play()
    playRequest?.catch(() => setPhase('fallback'))
    return () => clearTimeout(videoWatchdogRef.current)
  }, [phase])

  useEffect(() => {
    if (phase !== 'fallback') return

    const fallbackTimer = setTimeout(() => {
      setIsFading(true)
      setTimeout(() => setPhase('reveal'), INTRO_FADE_MS)
    }, 3000)
    return () => clearTimeout(fallbackTimer)
  }, [phase])

  const startIntroFade = () => {
    if (fadeStartedRef.current) return
    fadeStartedRef.current = true
    setIsFading(true)
  }

  const updateIntroFade = (event) => {
    const video = event.currentTarget
    if (video.duration) setIntroProgress((video.currentTime / video.duration) * 100)
    if (video.duration && video.currentTime >= video.duration - INTRO_FADE_MS / 1000) {
      startIntroFade()
    }
  }

  const handleIntroPlaying = () => {
    clearTimeout(videoWatchdogRef.current)
    setIntroPlaying(true)
  }

  const finishIntro = () => {
    const fadeWasAlreadyStarted = fadeStartedRef.current
    startIntroFade()
    setTimeout(() => setPhase('reveal'), fadeWasAlreadyStarted ? 0 : INTRO_FADE_MS)
  }

  const units = [['Days', t.days], ['Hours', t.hours], ['Minutes', t.minutes], ['Seconds', t.seconds]]

  return (
    <>
      {phase === 'video' && (
        <div className={`intro-screen${isFading ? ' is-fading' : ''}`}>
          <video
            ref={videoRef}
            className="intro-video"
            src="/assets/dandiya-intro.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onTimeUpdate={updateIntroFade}
            onEnded={finishIntro}
            onPlaying={handleIntroPlaying}
            onError={() => setPhase('fallback')}
            aria-hidden="true"
          />
          <div className="intro-overlay" aria-hidden="true" />
          {introPlaying && (
            <div className="intro-progress" aria-hidden="true">
              <span>Entering Navrang...</span>
              <div className="intro-progress-track">
                <i style={{ transform: `scaleX(${introProgress / 100})` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'fallback' && (
        <div className={`intro-screen fallback-screen${isFading ? ' is-fading' : ''}`}>
          <div className="fallback-art" aria-hidden="true" />
          <div className="intro-overlay" aria-hidden="true" />
          <Particles n={24} />
          <div className="loadline" aria-hidden="true" />
        </div>
      )}

      {phase === 'reveal' && <main className="stage">
      <div className="bg-art" style={{ backgroundImage: "url('/assets/mata-ji.jpg')" }} aria-hidden="true" />
      <div className="smoke s1" aria-hidden="true" /><div className="smoke s2" aria-hidden="true" />
      <div className="rays" aria-hidden="true" />
      <Particles />
      <div className="vignette" aria-hidden="true" />
      <div className="loadline" aria-hidden="true" />

      <section className="card" role="timer" aria-label="Countdown to Navrang 2026">
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
        <p className="deva" lang="hi">नवरंग</p>
        <h1 className="title">NAVRANG<span>2026</span></h1>
        <div className="orn" aria-hidden="true"><i /><b>◆</b><i /></div>
        <p className="college">Mukand Lal National College</p>
        <p className="city">Yamunanagar</p>
        <p className="tag">Let the Navrang begin</p>
        <p className="date">17 October 2026</p>

        {t.done ? (
          <div className="begun"><Particles n={40} burst /><h2>NAVRANG HAS BEGUN</h2></div>
        ) : (
          <div className="count">
            {units.map(([l, v]) => (
              <div className="unit" key={l}>
                <span className="num" aria-hidden="true">{pad(v)}</span>
                <span className="lab">{l}</span>
                <span className="sr">{v} {l}</span>
              </div>
            ))}
          </div>
        )}
        <p className="presented-by">Presented By~ MLN Alliance Mediacrew</p>
      </section>
      </main>}
    </>
  )
}
