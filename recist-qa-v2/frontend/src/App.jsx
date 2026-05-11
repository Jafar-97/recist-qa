import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Problems from './components/Problems'
import Solutions from './components/Solutions'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'

export default function App() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <main>
        <section id="hero"><Hero /></section>
        <section id="problem"><Problems /></section>
        <section id="solution"><Solutions /></section>
        <section id="demo"><Dashboard /></section>
      </main>
      <Footer />
    </div>
  )
}
