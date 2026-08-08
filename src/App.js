import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

const Icon = ({ name, size = 20 }) => {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    architecture: <><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="3" width="6" height="6" rx="1.5"/><rect x="9" y="15" width="6" height="6" rx="1.5"/><path d="M6 9v3h12V9M12 12v3"/></>,
    services: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>,
    deploy: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
    operations: <><path d="M4 17 10 11 4 5M12 19h8"/></>,
    security: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    reference: <><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    alert: <><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
    external: <><path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
    box: <><path d="m21 8-9 5-9-5 9-5 9 5Z"/><path d="m3 8 9 5 9-5v8l-9 5-9-5V8Z"/><path d="M12 13v8"/></>,
    network: <><circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="m7 11 10-5M7 13l10 5"/></>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const navItems = [
  ['overview', 'Overview'], ['architecture', 'Architecture'], ['services', 'Services'],
  ['deployment', 'Deployment'], ['operations', 'Operations'], ['security', 'Security'], ['reference', 'Reference']
];

const services = [
  { name: 'Jenkins', image: 'myjenkins-blueocean:lts', desc: 'CI/CD controller with Docker CLI, Pipeline, Blue Ocean, and Prometheus integration.', icon: 'J', tone: 'amber', port: '49000' },
  { name: 'Nginx', image: 'nginx:stable', desc: 'Single reverse-proxy entry point routing traffic to Jenkins and platform services.', icon: 'N', tone: 'green', port: '80' },
  { name: 'Docker-in-Docker', image: 'docker:dind', desc: 'Isolated TLS-enabled Docker daemon used by Jenkins pipeline workloads.', icon: 'D', tone: 'blue', port: '2376' },
  { name: 'Prometheus', image: 'prom/prometheus', desc: 'Collects Jenkins, host, and container metrics for operational visibility.', icon: 'P', tone: 'red', port: '9090' },
  { name: 'Grafana', image: 'grafana/grafana', desc: 'Dashboard experience with Prometheus provisioned as its primary datasource.', icon: 'G', tone: 'orange', port: '3030' },
  { name: 'Node Exporter', image: 'prom/node-exporter:v1.8.2', desc: 'Exposes Ubuntu host-level CPU, memory, filesystem, and network metrics.', icon: 'NE', tone: 'violet', port: 'internal' },
  { name: 'cAdvisor', image: 'gcr.io/cadvisor/cadvisor:v0.49.1', desc: 'Surfaces resource and performance metrics for running Docker containers.', icon: 'CA', tone: 'cyan', port: 'internal' },
];

const commands = {
  prepare: `sudo mkdir -p /opt/compose-stack /srv/jenkins/home\nsudo chown -R "$USER:$USER" /opt/compose-stack\nsudo chown -R 1000:1000 /srv/jenkins/home`,
  configure: `cd /opt/compose-stack\ncp .env.example .env\n# Review credentials and exposed ports before launch`,
  core: `docker compose up -d --build`,
  full: `docker compose -f compose.yaml -f compose.observability.yaml up -d --build`,
  password: `docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword`,
};

const config = [
  ['COMPOSE_PROJECT_NAME', 'compose-stack', 'Compose project namespace'],
  ['JENKINS_HTTP_PORT', '49000', 'Direct Jenkins access'],
  ['JENKINS_AGENT_PORT', '50000', 'Inbound build agents'],
  ['NGINX_HTTP_PORT', '9000', 'Reverse-proxy entry point'],
  ['HOST_HOME', '/srv/jenkins/home', 'Shared host workspace'],
  ['PROMETHEUS_PORT', '9090', 'Metrics UI and API'],
  ['GRAFANA_PORT', '3030', 'Dashboard UI'],
  ['GRAFANA_ADMIN_PASSWORD', 'change-me', 'Change before production'],
];

function CodeBlock({ children, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return <div className="code-block">
    <div className="code-head"><span>{label}</span><button onClick={copy} aria-label={`Copy ${label}`}><Icon name={copied ? 'check' : 'copy'} size={16}/>{copied ? 'Copied' : 'Copy'}</button></div>
    <pre><code>{children}</code></pre>
  </div>;
}

function App() {
  const [theme, setTheme] = useState('dark');
  const [active, setActive] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-20% 0px -65%', threshold: [0, .2, .5] });
    navItems.forEach(([id]) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const key = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  const results = useMemo(() => navItems.filter(([, label]) => label.toLowerCase().includes(query.toLowerCase())), [query]);
  const jump = id => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); setSearchOpen(false); setQuery(''); };

  return <div className="app-shell">
    <header className="mobile-header">
      <button className="icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Icon name={menuOpen ? 'close' : 'menu'}/></button>
      <div className="brand compact"><div className="brand-mark"><span></span><span></span><span></span></div><strong>Compose Stack</strong></div>
      <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme"><Icon name={theme === 'dark' ? 'sun' : 'moon'}/></button>
    </header>

    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><span></span><span></span><span></span></div><div><strong>Compose Stack</strong><small>Operations handbook</small></div></div>
      <nav aria-label="Documentation navigation">
        <p className="nav-label">Documentation</p>
        {navItems.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => jump(id)}><Icon name={id === 'deployment' ? 'deploy' : id}/><span>{label}</span>{active === id && <i/>}</button>)}
      </nav>
      <div className="sidebar-footer">
        <div className="version"><span className="status-dot"/><div><small>Source snapshot</small><strong>Compose v2</strong></div><span className="version-pill">LIVE</span></div>
        <p>Single-host CI platform<br/>for Ubuntu & Docker.</p>
      </div>
    </aside>
    {menuOpen && <div className="menu-scrim" onClick={() => setMenuOpen(false)}/>} 

    <main>
      <div className="topbar">
        <button className="search-trigger" onClick={() => setSearchOpen(true)}><Icon name="search" size={18}/><span>Search documentation</span><kbd>Ctrl K</kbd></button>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme"><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18}/></button>
        <a className="repo-link" href="https://docs.docker.com/compose/" target="_blank" rel="noreferrer">Docker Compose <Icon name="external" size={15}/></a>
      </div>

      <section id="overview" className="hero section-wrap">
        <div className="eyebrow"><span className="pulse-dot"/> Production-minded reference · Ubuntu</div>
        <h1>Build, observe, and operate your <span>CI platform.</span></h1>
        <p className="hero-copy">A practical field guide for running Jenkins, Docker-in-Docker, Nginx, and a complete observability layer from one Compose project.</p>
        <div className="hero-actions"><button className="primary" onClick={() => jump('deployment')}>Start deploying <Icon name="arrow"/></button><button className="secondary" onClick={() => jump('architecture')}>Explore architecture</button></div>
        <div className="metrics-strip">
          <div><strong>07</strong><span>Services</span></div><div><strong>02</strong><span>Networks</span></div><div><strong>04</strong><span>Named volumes</span></div><div><strong>01</strong><span>Compose project</span></div>
        </div>
      </section>

      <section id="architecture" className="section-wrap doc-section">
        <div className="section-kicker">01 · Architecture</div><div className="section-heading"><div><h2>One stack, clear responsibilities.</h2><p>Traffic, builds, and telemetry stay logically separated while sharing a simple operational boundary.</p></div><span className="tag">NON-SEPARATED</span></div>
        <div className="architecture-card">
          <div className="flow-row primary-flow">
            <div className="flow-node client"><small>ENTRY</small><b>Users & agents</b><span>HTTP · TCP</span></div><div className="flow-line"><span>request</span><Icon name="arrow"/></div>
            <div className="flow-node green"><small>PROXY</small><b>Nginx</b><span>:80 internal</span></div><div className="flow-line"><span>Docker DNS</span><Icon name="arrow"/></div>
            <div className="flow-node amber"><small>CONTROL</small><b>Jenkins</b><span>:8080 internal</span></div><div className="flow-line"><span>TLS</span><Icon name="arrow"/></div>
            <div className="flow-node blue"><small>RUNTIME</small><b>Docker-in-Docker</b><span>:2376 internal</span></div>
          </div>
          <div className="telemetry-line"><span>metrics & telemetry</span></div>
          <div className="flow-row observability-flow">
            <div className="flow-node muted"><small>HOST</small><b>Node Exporter</b><span>Ubuntu metrics</span></div>
            <div className="flow-node muted"><small>CONTAINERS</small><b>cAdvisor</b><span>Runtime metrics</span></div>
            <div className="flow-node red"><small>COLLECT</small><b>Prometheus</b><span>:9090</span></div>
            <div className="flow-node orange"><small>VISUALIZE</small><b>Grafana</b><span>:3030</span></div>
          </div>
          <div className="network-legend"><span><i className="ci-dot"/>compose-stack-ci</span><span><i className="obs-dot"/>compose-stack-observability</span></div>
        </div>
        <div className="callout info"><Icon name="alert"/><div><strong>Current source behavior</strong><p>The active <code>compose.yaml</code> already declares Jenkins, Nginx, Docker, Prometheus, and Grafana. The observability overlay extends Prometheus/Grafana and adds Node Exporter, cAdvisor, and the observability network.</p></div></div>
      </section>

      <section id="services" className="section-wrap doc-section">
        <div className="section-kicker">02 · Services</div><div className="section-heading"><div><h2>Everything in the platform.</h2><p>Each container has one clear job and a predictable connection to the rest of the stack.</p></div></div>
        <div className="service-grid">{services.map(s => <article className="service-card" key={s.name}><div className={`service-icon ${s.tone}`}>{s.icon}</div><div className="service-title"><h3>{s.name}</h3><span>{s.port}</span></div><p>{s.desc}</p><div className="image-name"><Icon name="box" size={15}/><code>{s.image}</code></div></article>)}</div>
      </section>

      <section id="deployment" className="section-wrap doc-section">
        <div className="section-kicker">03 · Deployment</div><div className="section-heading"><div><h2>From zero to running.</h2><p>A repeatable launch path for a fresh Ubuntu host. Review the environment before exposing any endpoint.</p></div><span className="tag success">~ 5 MIN</span></div>
        <div className="steps">
          <article className="step"><div className="step-number">1</div><div className="step-content"><h3>Prepare the host</h3><p>Create a stable deployment root and the shared Jenkins workspace.</p><CodeBlock label="terminal">{commands.prepare}</CodeBlock></div></article>
          <article className="step"><div className="step-number">2</div><div className="step-content"><h3>Configure the environment</h3><p>Copy the template, then replace placeholder credentials and confirm port exposure.</p><CodeBlock label="terminal">{commands.configure}</CodeBlock></div></article>
          <article className="step"><div className="step-number">3</div><div className="step-content"><h3>Launch the platform</h3><p>Use the base file for the current five-service stack, or merge the overlay to include host and container exporters.</p><div className="dual-code"><CodeBlock label="base stack">{commands.core}</CodeBlock><CodeBlock label="with exporters">{commands.full}</CodeBlock></div></div></article>
          <article className="step"><div className="step-number">4</div><div className="step-content"><h3>Unlock Jenkins</h3><p>Retrieve the one-time administrator password from the running controller.</p><CodeBlock label="terminal">{commands.password}</CodeBlock></div></article>
        </div>
        <div className="endpoint-grid"><div><span className="endpoint-dot amber"/><p><small>Jenkins</small><code>SERVER_IP:49000</code></p></div><div><span className="endpoint-dot green"/><p><small>Nginx</small><code>SERVER_IP:9000</code></p></div><div><span className="endpoint-dot red"/><p><small>Prometheus</small><code>SERVER_IP:9090</code></p></div><div><span className="endpoint-dot orange"/><p><small>Grafana</small><code>SERVER_IP:3030</code></p></div></div>
      </section>

      <section id="operations" className="section-wrap doc-section">
        <div className="section-kicker">04 · Operations</div><div className="section-heading"><div><h2>Daily operations, without guesswork.</h2><p>Common commands and persistent data locations for routine platform care.</p></div></div>
        <div className="ops-layout"><div className="command-list">
          {[['Inspect service health','docker compose ps'],['Follow Jenkins logs','docker compose logs -f jenkins'],['Restart the controller','docker compose restart jenkins'],['Stop and preserve data','docker compose -f compose.yaml -f compose.observability.yaml down']].map(([title, cmd]) => <div className="command-row" key={title}><div><strong>{title}</strong><code>{cmd}</code></div><button onClick={() => navigator.clipboard && navigator.clipboard.writeText(cmd)} aria-label={`Copy ${title}`}><Icon name="copy" size={17}/></button></div>)}
        </div><div className="storage-card"><div className="card-label"><Icon name="box"/> Persistent storage</div><h3>State lives outside Git.</h3><p>Docker named volumes keep application data independent from the configuration repository.</p><ul><li><span>Jenkins data</span><code>compose-stack-jenkins-data</code></li><li><span>Docker TLS certs</span><code>compose-stack-jenkins-docker-certs</code></li><li><span>Prometheus TSDB</span><code>compose-stack-prometheus-data</code></li><li><span>Grafana state</span><code>compose-stack-grafana-data</code></li></ul><div className="path-note">Ubuntu path<br/><code>/var/lib/docker/volumes/&lt;name&gt;/_data</code></div></div></div>
      </section>

      <section id="security" className="section-wrap doc-section">
        <div className="section-kicker">05 · Security</div><div className="section-heading"><div><h2>Secure the edges first.</h2><p>The defaults are development-friendly. Apply these controls before treating the stack as production-ready.</p></div></div>
        <div className="security-grid"><div className="security-list">
          {['Replace the default Grafana administrator password','Keep the local .env file out of source control','Restrict Jenkins, Grafana, and Prometheus at the host firewall','Terminate HTTPS at a trusted reverse proxy','Back up and test restoration of every named volume','Review privileged access required by Docker-in-Docker'].map((item, i) => <div key={item}><span className={i < 2 ? 'check done' : 'check'}><Icon name={i < 2 ? 'check' : 'security'} size={15}/></span><p>{item}</p><small>{i < 2 ? 'Configured by repository pattern' : 'Operator action required'}</small></div>)}
        </div><div className="risk-card"><div className="risk-icon"><Icon name="alert" size={25}/></div><span>IMPORTANT</span><h3>Privileged runtime boundary</h3><p><code>docker:dind</code> and cAdvisor use privileged access in this design. Limit host access, pin trusted images, and treat control of Jenkins pipelines as infrastructure-level privilege.</p><div className="risk-meta"><span>Risk surface</span><strong>Host & build runtime</strong></div></div></div>
      </section>

      <section id="reference" className="section-wrap doc-section reference-section">
        <div className="section-kicker">06 · Reference</div><div className="section-heading"><div><h2>Configuration at a glance.</h2><p>Core environment values from the repository template. Defaults remain overridable per host.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Variable</th><th>Default</th><th>Purpose</th></tr></thead><tbody>{config.map(([key, value, purpose]) => <tr key={key}><td><code>{key}</code></td><td><code className={value === 'change-me' ? 'danger-value' : ''}>{value}</code></td><td>{purpose}</td></tr>)}</tbody></table></div>
        <div className="footer-cta"><div><span className="status-dot"/><small>READY TO OPERATE</small><h2>Keep the platform boring.<br/><em>Make the delivery remarkable.</em></h2></div><button className="primary" onClick={() => jump('overview')}>Back to top <span>↑</span></button></div>
        <footer><span>Compose Stack · Operations Handbook</span><span>Source: <code>C:\Development\Courses\compose-stack</code></span></footer>
      </section>
    </main>

    {searchOpen && <div className="search-modal" role="dialog" aria-modal="true" aria-label="Search documentation" onMouseDown={() => setSearchOpen(false)}><div className="search-panel" onMouseDown={e => e.stopPropagation()}><div className="search-input"><Icon name="search"/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Jump to a section..."/><kbd>ESC</kbd></div><div className="search-results"><small>DOCUMENTATION</small>{results.map(([id, label]) => <button key={id} onClick={() => jump(id)}><Icon name={id === 'deployment' ? 'deploy' : id}/><span>{label}</span><Icon name="arrow" size={16}/></button>)}{!results.length && <p>No matching sections.</p>}</div></div></div>}
  </div>;
}

export default App;
