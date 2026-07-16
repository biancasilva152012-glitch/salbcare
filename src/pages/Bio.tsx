import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const CSS = `
  :root{
    --navy:#0F1F3A;
    --navy-deep:#091529;
    --cream:#F4EEE2;
    --teal:#34BFB4;
    --gold:#CFA856;
    --ink-soft:rgba(15,31,58,.64);
    --radius:22px;
  }
  body.bio-page{
    margin:0;padding:0;
    background:var(--navy);
    background-image:radial-gradient(900px 520px at 50% -6%, #17304f 0%, var(--navy) 52%, var(--navy-deep) 100%);
    color:var(--cream);
    font-family:'Inter',sans-serif;
    min-height:100vh;
  }
  body.bio-page #root{display:flex;justify-content:center;padding:24px 18px 44px;min-height:100vh;box-sizing:border-box}
  .bio-root *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  .bio-root{width:100%;max-width:440px}
  .bio-root .mono{font-family:'IBM Plex Mono',monospace}
  .bio-root .lang{display:flex;justify-content:center;gap:6px;margin-bottom:22px}
  .bio-root .lang button{
    font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.14em;
    background:transparent;color:rgba(244,238,226,.55);
    border:1px solid rgba(244,238,226,.22);
    padding:7px 16px;border-radius:999px;cursor:pointer;transition:all .25s ease;
  }
  .bio-root .lang button.active{background:var(--cream);color:var(--navy);border-color:var(--cream);font-weight:600}
  .bio-root .brand{text-align:center;margin-bottom:24px}
  .bio-root .logo-wrap{position:relative;display:inline-block;margin-bottom:14px}
  .bio-root .logo-wrap::before{
    content:"";position:absolute;inset:-26px;
    background:radial-gradient(circle, rgba(52,191,180,.32) 0%, rgba(52,191,180,0) 68%);
    z-index:0;
  }
  .bio-root .logo{position:relative;z-index:1;width:96px;height:auto;display:block;margin:0 auto;
    filter:drop-shadow(0 10px 24px rgba(0,0,0,.45));}
  .bio-root .brand h1{
    font-family:'Gloock',serif;font-weight:400;
    font-size:clamp(34px,10vw,42px);letter-spacing:.01em;line-height:1;
  }
  .bio-root .brand .rule{width:54px;height:2px;background:var(--gold);margin:14px auto 12px;border-radius:2px}
  .bio-root .tagline{font-size:14px;font-weight:500;line-height:1.6;color:rgba(244,238,226,.85);margin-bottom:6px}
  .bio-root .sub{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--teal)}
  .bio-root .spots{
    margin-top:14px;font-size:11px;letter-spacing:.06em;
    color:rgba(244,238,226,.5);
  }
  .bio-root .spots span{color:var(--gold)}
  .bio-root .cards{display:flex;flex-direction:column;gap:14px;margin-top:24px}
  .bio-root .card{
    display:flex;align-items:center;gap:16px;width:100%;text-align:left;
    background:var(--cream);color:var(--navy);
    border-radius:var(--radius);padding:18px;
    text-decoration:none;border:none;cursor:pointer;
    font-family:'Inter',sans-serif;
    transition:transform .22s ease, box-shadow .22s ease;
    opacity:0;transform:translateY(14px);animation:bio-rise .55s ease forwards;
  }
  .bio-root .card:nth-child(1){animation-delay:.05s}
  .bio-root .card:nth-child(2){animation-delay:.12s}
  .bio-root .card:nth-child(3){animation-delay:.19s}
  .bio-root .card:nth-child(4){animation-delay:.26s}
  .bio-root .card:nth-child(5){animation-delay:.33s}
  @keyframes bio-rise{to{opacity:1;transform:translateY(0)}}
  .bio-root .card:active{transform:scale(.985)}
  @media(hover:hover){.bio-root .card:hover{transform:translateY(-3px);box-shadow:0 14px 34px rgba(0,0,0,.35)}}
  .bio-root .icon{
    flex:0 0 46px;height:46px;border-radius:14px;
    display:flex;align-items:center;justify-content:center;background:var(--navy);
  }
  .bio-root .icon svg{width:22px;height:22px;stroke:var(--teal);fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
  .bio-root .card .txt{flex:1;min-width:0}
  .bio-root .card .eyebrow{
    font-family:'IBM Plex Mono',monospace;
    font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:4px;font-weight:600;
  }
  .bio-root .card h2{font-family:'Gloock',serif;font-weight:400;font-size:19.5px;line-height:1.15;margin-bottom:4px}
  .bio-root .card p{font-size:12px;line-height:1.55;color:var(--ink-soft)}
  .bio-root .arrow{flex:0 0 auto;color:var(--navy);opacity:.55;transition:transform .22s ease,opacity .22s ease}
  @media(hover:hover){.bio-root .card:hover .arrow{transform:translateX(4px);opacity:1}}
  .bio-root .card.pro{border:1.5px solid var(--gold);box-shadow:0 0 0 4px rgba(207,168,86,.12)}
  .bio-root .pill{
    font-family:'IBM Plex Mono',monospace;
    font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;
    color:var(--navy);background:var(--gold);padding:3px 9px;border-radius:999px;
    display:inline-block;margin-bottom:5px;
  }
  .bio-root .card.community{background:transparent;color:var(--cream);border:1px solid var(--teal)}
  .bio-root .card.community .icon{background:var(--teal)}
  .bio-root .card.community .icon svg{stroke:var(--navy)}
  .bio-root .card.community h2{color:var(--cream)}
  .bio-root .card.community p{color:rgba(244,238,226,.7)}
  .bio-root .card.community .arrow{color:var(--teal);opacity:.9}
  .bio-root .card.soon{
    background:rgba(244,238,226,.06);color:var(--cream);
    border:1px dashed rgba(207,168,86,.45);cursor:default;pointer-events:none;
  }
  .bio-root .card.soon .icon{background:rgba(244,238,226,.08)}
  .bio-root .card.soon .icon svg{stroke:var(--gold)}
  .bio-root .card.soon h2{color:rgba(244,238,226,.85)}
  .bio-root .card.soon p{color:rgba(244,238,226,.5)}
  .bio-root .badge{
    font-family:'IBM Plex Mono',monospace;
    font-size:9px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;
    color:var(--navy);background:var(--gold);padding:4px 10px;border-radius:999px;white-space:nowrap;
  }
  .bio-root footer{margin-top:34px;text-align:center}
  .bio-root footer .mark{font-family:'Gloock',serif;font-size:16px}
  .bio-root footer p{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(244,238,226,.45);margin-top:8px}
  .bio-root footer a{color:var(--gold);text-decoration:none;font-size:11px;letter-spacing:.08em}
  .bio-overlay{
    position:fixed;inset:0;background:rgba(9,21,41,.72);backdrop-filter:blur(3px);
    opacity:0;pointer-events:none;transition:opacity .3s ease;z-index:50;
  }
  .bio-overlay.open{opacity:1;pointer-events:auto}
  .bio-sheet{
    position:fixed;left:0;right:0;bottom:0;z-index:60;
    background:var(--cream);color:var(--navy);
    border-radius:26px 26px 0 0;
    max-width:480px;margin:0 auto;
    max-height:88vh;overflow-y:auto;
    padding:22px 22px calc(26px + env(safe-area-inset-bottom));
    transform:translateY(105%);transition:transform .38s cubic-bezier(.32,.72,.28,1);
    font-family:'Inter',sans-serif;
  }
  .bio-sheet.open{transform:translateY(0)}
  .bio-sheet .grab{width:42px;height:4px;border-radius:99px;background:rgba(15,31,58,.18);margin:0 auto 18px}
  .bio-sheet h3{font-family:'Gloock',serif;font-weight:400;font-size:24px;line-height:1.15;margin-bottom:6px}
  .bio-sheet .lead{font-size:13px;line-height:1.6;color:var(--ink-soft);margin-bottom:18px}
  .bio-sheet label{
    display:block;font-family:'IBM Plex Mono',monospace;
    font-size:10px;letter-spacing:.16em;text-transform:uppercase;
    font-weight:600;color:var(--navy);margin:14px 0 6px;
  }
  .bio-sheet input,.bio-sheet select{
    width:100%;font-family:'Inter',sans-serif;font-size:15px;color:var(--navy);
    background:#fff;border:1px solid rgba(15,31,58,.18);border-radius:12px;
    padding:13px 14px;outline:none;transition:border-color .2s ease, box-shadow .2s ease;
    -webkit-appearance:none;appearance:none;
  }
  .bio-sheet input:focus,.bio-sheet select:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(52,191,180,.18)}
  .bio-btn{
    display:block;width:100%;text-align:center;text-decoration:none;cursor:pointer;
    font-family:'Inter',sans-serif;font-weight:600;font-size:15px;letter-spacing:.01em;
    border:none;border-radius:14px;padding:16px;margin-top:20px;
    transition:transform .15s ease, opacity .2s ease;
  }
  .bio-btn:active{transform:scale(.985)}
  .bio-btn.navy{background:var(--navy);color:var(--cream)}
  .bio-btn.gold{background:var(--gold);color:var(--navy)}
  .bio-btn[disabled]{opacity:.55;cursor:wait}
  .bio-sheet .close{
    position:absolute;top:16px;right:16px;width:34px;height:34px;border-radius:99px;
    background:rgba(15,31,58,.08);border:none;color:var(--navy);
    font-size:16px;cursor:pointer;line-height:1;
  }
  .bio-sheet .fine{font-size:11px;line-height:1.55;color:var(--ink-soft);margin-top:12px;text-align:center}
  .bio-sheet .success{display:none;text-align:center;padding:8px 4px 4px}
  .bio-sheet .success .check{
    width:64px;height:64px;border-radius:99px;background:var(--teal);
    display:flex;align-items:center;justify-content:center;margin:6px auto 16px;
  }
  .bio-sheet .success .check svg{width:30px;height:30px;stroke:#fff;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round}
  .bio-sheet .success h3{margin-bottom:8px}
  .bio-sheet .success .lead{margin-bottom:4px}
  .bio-sheet .offer{
    margin-top:18px;border:1.5px solid var(--gold);border-radius:18px;
    padding:18px 16px;background:rgba(207,168,86,.08);text-align:left;
  }
  .bio-sheet .offer .pill{margin-bottom:8px;display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;color:var(--navy);background:var(--gold);padding:3px 9px;border-radius:999px}
  .bio-sheet .offer .price{font-family:'Gloock',serif;font-size:26px;line-height:1.1}
  .bio-sheet .offer .per{font-size:12px;color:var(--ink-soft);margin-top:4px}
  .bio-sheet .offer ul{list-style:none;margin-top:12px;padding:0}
  .bio-sheet .offer li{font-size:12.5px;line-height:1.7;color:var(--navy);padding-left:18px;position:relative}
  .bio-sheet .offer li::before{content:"✓";position:absolute;left:0;color:var(--teal);font-weight:700}
  .bio-sheet .paybadges{
    display:flex;gap:8px;justify-content:center;margin-top:10px;
    font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;
    color:var(--ink-soft);text-transform:uppercase;
  }
  @media (prefers-reduced-motion: reduce){
    .bio-root .card{animation:none;opacity:1;transform:none}
    .bio-sheet,.bio-overlay{transition:none}
  }
`;

const MARKUP = `
<div class="bio-root">
  <div class="lang" role="tablist" aria-label="Idioma">
    <button data-lang="pt" class="active" type="button">PT</button>
    <button data-lang="en" type="button">EN</button>
    <button data-lang="es" type="button">ES</button>
  </div>

  <header class="brand">
    <div class="logo-wrap">
      <img class="logo" src="/salbcare-logo.png" alt="SalbCare" width="96" height="100">
    </div>
    <h1>salbcare</h1>
    <div class="rule"></div>
    <p class="tagline" data-i18n="tagline">Conectamos quem cuida, a quem precisa.</p>
    <p class="sub" data-i18n="sub">Escolha como você quer se conectar</p>
    <p class="spots">Jericoacoara <span>·</span> Preá <span>·</span> Ilha do Guajiru <span>·</span> Cumbuco</p>
  </header>

  <main class="cards">
    <a class="card" id="card-patient" href="#" target="_blank" rel="noopener">
      <div class="icon"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M12 13v5M9.5 15.5h5"/></svg></div>
      <div class="txt">
        <div class="eyebrow" data-i18n="p1e">Agende seu atendimento</div>
        <h2 data-i18n="p1t">Paciente</h2>
        <p data-i18n="p1d">Cuidado de saúde no seu idioma, direto no WhatsApp do profissional.</p>
      </div>
      <svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>

    <button class="card pro" id="card-pro" type="button">
      <div class="icon"><svg viewBox="0 0 24 24"><circle cx="10" cy="8" r="3.5"/><path d="M4 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M18 6v6M15 9h6"/></svg></div>
      <div class="txt">
        <span class="pill" data-i18n="p2pill">Vagas de fundador</span>
        <div class="eyebrow" data-i18n="p2e">Seja parceiro SalbCare</div>
        <h2 data-i18n="p2t">Clínica ou profissional</h2>
        <p data-i18n="p2d">Atenda turistas internacionais. Cadastro em 1 minuto.</p>
      </div>
      <svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </button>

    <button class="card" id="card-insurance" type="button">
      <div class="icon"><svg viewBox="0 0 24 24"><path d="M12 3l8 3v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg></div>
      <div class="txt">
        <div class="eyebrow" data-i18n="p3e">Parcerias estratégicas</div>
        <h2 data-i18n="p3t">Seguradoras e corretoras</h2>
        <p data-i18n="p3d">A ponte entre seus clientes e profissionais verificados no Brasil.</p>
      </div>
      <svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </button>

    <a class="card community" id="card-community" href="#" target="_blank" rel="noopener">
      <div class="icon"><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 10-3.6 7.2L21 21l-1-3.6A8.96 8.96 0 0021 12z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/></svg></div>
      <div class="txt">
        <div class="eyebrow" data-i18n="p5e">Comunidade global</div>
        <h2 data-i18n="p5t">Entrar no WhatsApp</h2>
        <p data-i18n="p5d">Boletim do vento, downwinds e suporte de saúde para viajantes.</p>
      </div>
      <svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>

    <div class="card soon" id="card-store" aria-disabled="true">
      <div class="icon"><svg viewBox="0 0 24 24"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg></div>
      <div class="txt">
        <div class="eyebrow" data-i18n="p4e">SalbCare Store</div>
        <h2 data-i18n="p4t">Produtos exclusivos</h2>
        <p data-i18n="p4d">Ecobags, camisetas, bonés e mais, para quem vive o cuidado.</p>
      </div>
      <span class="badge" data-i18n="p4b">Em breve</span>
    </div>
  </main>

  <footer>
    <div class="mark">salbcare</div>
    <p data-i18n="foot">Care, without borders</p>
    <a href="https://salbcare.com" target="_blank" rel="noopener">salbcare.com</a>
  </footer>
</div>

<div class="bio-overlay" id="bio-overlay"></div>

<div class="bio-sheet" id="bio-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
  <button class="close" id="sheet-close" aria-label="Fechar" type="button">✕</button>
  <div class="grab"></div>

  <div id="form-view">
    <h3 id="sheet-title">Seja parceiro SalbCare</h3>
    <p class="lead">Rede curada de profissionais que atendem turistas internacionais no litoral do Ceará. Preencha e receba os próximos passos no seu WhatsApp.</p>

    <form id="partner-form">
      <label for="f-nome">Nome completo</label>
      <input id="f-nome" name="Nome" type="text" required autocomplete="name" placeholder="Seu nome">

      <label for="f-prof">Profissão</label>
      <select id="f-prof" name="Profissao" required>
        <option value="" disabled selected>Selecione</option>
        <option>Médico(a)</option>
        <option>Dentista</option>
        <option>Fisioterapeuta</option>
        <option>Psicólogo(a)</option>
        <option>Nutricionista</option>
        <option>Clínica</option>
        <option>Outro</option>
      </select>

      <label for="f-esp">Especialidade</label>
      <input id="f-esp" name="Especialidade" type="text" required placeholder="Ex: ortopedia, estética, clínico geral">

      <label for="f-cidade">Cidade onde atende</label>
      <input id="f-cidade" name="Cidade" type="text" required placeholder="Ex: Jericoacoara, Fortaleza, Cumbuco">

      <label for="f-zap">WhatsApp</label>
      <input id="f-zap" name="WhatsApp" type="tel" required inputmode="tel" autocomplete="tel" placeholder="+55 (85) 9 0000-0000">

      <label for="f-idiomas">Idiomas que atende</label>
      <select id="f-idiomas" name="Idiomas" required>
        <option value="" disabled selected>Selecione</option>
        <option>Somente português</option>
        <option>Português e inglês</option>
        <option>Português e espanhol</option>
        <option>Português, inglês e espanhol</option>
      </select>

      <button class="bio-btn navy" id="submit-btn" type="submit">Quero ser parceiro</button>
      <p class="fine">Sem taxa sobre consultas. O paciente fala direto com você no WhatsApp.</p>
    </form>
  </div>

  <div class="success" id="success-view">
    <div class="check"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg></div>
    <h3>Cadastro recebido!</h3>
    <p class="lead">Nossa equipe vai analisar seu perfil e falar com você no WhatsApp.</p>

    <div class="offer">
      <span class="pill">Condição de fundador</span>
      <div class="price">R$ 259 <span style="font-size:14px">+ R$ 69/mês</span></div>
      <p class="per">Onboarding único + mensalidade fundador, preço travado</p>
      <ul>
        <li>Perfil verificado na vitrine internacional</li>
        <li>Pacientes direto no seu WhatsApp, sem comissão</li>
        <li>Triagem em português, inglês e espanhol</li>
      </ul>
      <a class="bio-btn gold" id="pay-btn" href="#" target="_blank" rel="noopener">Garantir minha vaga agora</a>
      <div class="paybadges"><span>Apple Pay</span><span>·</span><span>Google Pay</span><span>·</span><span>Cartão</span></div>
    </div>
  </div>
</div>

<div class="bio-sheet" id="bio-sheet-ins" role="dialog" aria-modal="true" aria-labelledby="ins-title">
  <button class="close" id="ins-close" aria-label="Fechar" type="button">✕</button>
  <div class="grab"></div>

  <div id="ins-form-view">
    <h3 id="ins-title">Parcerias estratégicas</h3>
    <p class="lead"><strong>A SalbCare não é uma seguradora.</strong> Somos a ponte inteligente entre seus segurados em viagem e profissionais de saúde verificados no litoral do Brasil.</p>

    <div class="offer" style="margin-top:0;margin-bottom:6px">
      <span class="pill">Como funciona</span>
      <ul>
        <li>Seu cliente aciona, nós localizamos o profissional certo em minutos</li>
        <li>Triagem em português, inglês e espanhol, direto no WhatsApp</li>
        <li>Rede curada e verificada, menos tempo de resposta, cliente mais satisfeito</li>
        <li>Modelo simples por apólice ativa, sem custo fixo para começar</li>
      </ul>
    </div>

    <form id="ins-form">
      <label for="i-empresa">Empresa</label>
      <input id="i-empresa" name="Empresa" type="text" required placeholder="Nome da seguradora ou corretora">

      <label for="i-nome">Seu nome</label>
      <input id="i-nome" name="Nome" type="text" required autocomplete="name" placeholder="Nome e sobrenome">

      <label for="i-cargo">Cargo</label>
      <input id="i-cargo" name="Cargo" type="text" required placeholder="Ex: diretor comercial, corretor">

      <label for="i-email">E-mail corporativo</label>
      <input id="i-email" name="Email" type="email" required autocomplete="email" placeholder="voce@empresa.com">

      <label for="i-zap">WhatsApp ou telefone</label>
      <input id="i-zap" name="Telefone" type="tel" required inputmode="tel" placeholder="+55 (85) 9 0000-0000">

      <label for="i-clientes">Clientes segurados por ano</label>
      <select id="i-clientes" name="ClientesPorAno" required>
        <option value="" disabled selected>Selecione</option>
        <option>Até 500</option>
        <option>500 a 5.000</option>
        <option>5.000 a 50.000</option>
        <option>Mais de 50.000</option>
      </select>

      <label for="i-msg">Mensagem (opcional)</label>
      <input id="i-msg" name="Mensagem" type="text" placeholder="Conte um pouco do seu interesse">

      <button class="bio-btn navy" id="ins-submit" type="submit">Solicitar parceria</button>
      <p class="fine">Retornamos em até 24h com uma proposta comercial.</p>
    </form>
  </div>

  <div class="success" id="ins-success-view">
    <div class="check"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg></div>
    <h3>Solicitação recebida!</h3>
    <p class="lead">Nossa equipe comercial vai entrar em contato em até 24h com o modelo de parceria e os próximos passos.</p>
    <a class="bio-btn gold" id="ins-wa-btn" href="#" target="_blank" rel="noopener" style="display:none">Falar agora no WhatsApp</a>
  </div>
</div>
`;

const LINKS = {
  patient: "https://salbcare.com/kite",
  community: "https://chat.whatsapp.com/KVHchlB6w6d1CWpI8I3EBZ?s=cl&p=i&ilr=4&amv=0",
  stripePartner: "COLE_AQUI_SEU_PAYMENT_LINK_DO_STRIPE",
  formEmail: "biancadealbuquerquep@gmail.com",
  whatsappBianca: "",
};

const I18N: Record<string, Record<string, string>> = {
  pt: {
    tagline: "Conectamos quem cuida, a quem precisa.",
    sub: "Escolha como você quer se conectar",
    p1e: "Agende seu atendimento", p1t: "Paciente",
    p1d: "Cuidado de saúde no seu idioma, direto no WhatsApp do profissional.",
    p2pill: "Vagas de fundador",
    p2e: "Seja parceiro SalbCare", p2t: "Clínica ou profissional",
    p2d: "Atenda turistas internacionais. Cadastro em 1 minuto.",
    p3e: "Parcerias estratégicas", p3t: "Seguradoras e corretoras",
    p3d: "A ponte entre seus clientes e profissionais verificados no Brasil.",
    p4e: "SalbCare Store", p4t: "Produtos exclusivos",
    p4d: "Ecobags, camisetas, bonés e mais, para quem vive o cuidado.",
    p4b: "Em breve",
    p5e: "Comunidade global", p5t: "Entrar no WhatsApp",
    p5d: "Boletim do vento, downwinds e suporte de saúde para viajantes.",
    foot: "Care, without borders",
  },
  en: {
    tagline: "We connect those who care, to those who need it.",
    sub: "Choose how you want to connect",
    p1e: "Book your appointment", p1t: "Patient",
    p1d: "Healthcare in your language, straight to the professional's WhatsApp.",
    p2pill: "Founding spots",
    p2e: "Become a SalbCare partner", p2t: "Clinic or professional",
    p2d: "Care for international travelers. Sign up in 1 minute.",
    p3e: "Strategic partnerships", p3t: "Insurance and brokers",
    p3d: "The bridge between your clients and verified professionals in Brazil.",
    p4e: "SalbCare Store", p4t: "Exclusive products",
    p4d: "Ecobags, tees, caps and more, for those who live the care.",
    p4b: "Coming soon",
    p5e: "Global community", p5t: "Join us on WhatsApp",
    p5d: "Wind bulletin, downwinds and health support for travelers.",
    foot: "Care, without borders",
  },
  es: {
    tagline: "Conectamos a quienes cuidan, con quienes lo necesitan.",
    sub: "Elige cómo quieres conectarte",
    p1e: "Agenda tu atención", p1t: "Paciente",
    p1d: "Salud en tu idioma, directo al WhatsApp del profesional.",
    p2pill: "Cupos fundador",
    p2e: "Sé socio de SalbCare", p2t: "Clínica o profesional",
    p2d: "Atiende a turistas internacionales. Registro en 1 minuto.",
    p3e: "Alianzas estratégicas", p3t: "Aseguradoras y corredoras",
    p3d: "El puente entre tus clientes y profesionales verificados en Brasil.",
    p4e: "SalbCare Store", p4t: "Productos exclusivos",
    p4d: "Ecobags, camisetas, gorras y más, para quienes viven el cuidado.",
    p4b: "Próximamente",
    p5e: "Comunidad global", p5t: "Entrar al WhatsApp",
    p5d: "Boletín del viento, downwinds y apoyo de salud para viajeros.",
    foot: "Care, without borders",
  },
};

export default function Bio() {
  useEffect(() => {
    document.body.classList.add("bio-page");

    const container = document.getElementById("bio-mount");
    if (!container) return;
    container.innerHTML = MARKUP;

    // Wire links
    (document.getElementById("card-patient") as HTMLAnchorElement).href = LINKS.patient;
    (document.getElementById("card-community") as HTMLAnchorElement).href = LINKS.community;
    (document.getElementById("pay-btn") as HTMLAnchorElement).href = LINKS.stripePartner;
    if (LINKS.whatsappBianca) {
      const wa = document.getElementById("ins-wa-btn") as HTMLAnchorElement;
      wa.href =
        "https://wa.me/" +
        LINKS.whatsappBianca +
        "?text=" +
        encodeURIComponent("Olá Bianca! Acabei de solicitar parceria SalbCare para seguradoras.");
      wa.style.display = "block";
    }

    const sheet = document.getElementById("bio-sheet")!;
    const sheetIns = document.getElementById("bio-sheet-ins")!;
    const overlay = document.getElementById("bio-overlay")!;
    const openSheet = (el: HTMLElement) => { el.classList.add("open"); overlay.classList.add("open"); };
    const closeSheets = () => { sheet.classList.remove("open"); sheetIns.classList.remove("open"); overlay.classList.remove("open"); };

    const openPro = () => openSheet(sheet);
    const openIns = () => openSheet(sheetIns);
    document.getElementById("card-pro")!.addEventListener("click", openPro);
    document.getElementById("card-insurance")!.addEventListener("click", openIns);
    document.getElementById("sheet-close")!.addEventListener("click", closeSheets);
    document.getElementById("ins-close")!.addEventListener("click", closeSheets);
    overlay.addEventListener("click", closeSheets);

    async function sendForm(
      formEl: HTMLFormElement, subject: string,
      formView: string, successView: string,
      btnEl: HTMLButtonElement, btnLabel: string,
    ) {
      btnEl.disabled = true; btnEl.textContent = "Enviando...";
      const raw = Object.fromEntries(new FormData(formEl).entries()) as Record<string, string>;
      const data: Record<string, string> = { ...raw, _subject: subject, _template: "table" };
      let ok = false;
      try {
        const r = await fetch("https://formsubmit.co/ajax/" + LINKS.formEmail, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        ok = r.ok;
      } catch { ok = false; }
      if (!ok) {
        const body = encodeURIComponent(
          Object.entries(data).filter(([k]) => !k.startsWith("_")).map(([k, v]) => `${k}: ${v}`).join("\n"),
        );
        window.location.href = `mailto:${LINKS.formEmail}?subject=${encodeURIComponent(subject)}&body=${body}`;
      }
      (document.getElementById(formView) as HTMLElement).style.display = "none";
      (document.getElementById(successView) as HTMLElement).style.display = "block";
      btnEl.disabled = false; btnEl.textContent = btnLabel;
    }

    const partnerForm = document.getElementById("partner-form") as HTMLFormElement;
    const onPartner = (e: Event) => {
      e.preventDefault();
      const d = new FormData(partnerForm);
      sendForm(partnerForm, "💼 PROFISSIONAL interessado: " + (d.get("Nome") || ""),
        "form-view", "success-view",
        document.getElementById("submit-btn") as HTMLButtonElement, "Quero ser parceiro");
    };
    partnerForm.addEventListener("submit", onPartner);

    const insForm = document.getElementById("ins-form") as HTMLFormElement;
    const onIns = (e: Event) => {
      e.preventDefault();
      const d = new FormData(insForm);
      sendForm(insForm, "🔥 SEGURADORA interessada: " + (d.get("Empresa") || ""),
        "ins-form-view", "ins-success-view",
        document.getElementById("ins-submit") as HTMLButtonElement, "Solicitar parceria");
    };
    insForm.addEventListener("submit", onIns);

    const langButtons = document.querySelectorAll<HTMLButtonElement>(".bio-root .lang button");
    const setLang = (lang: string) => {
      const dict = I18N[lang];
      if (!dict) return;
      document.querySelectorAll<HTMLElement>(".bio-root [data-i18n], .bio-sheet [data-i18n]").forEach((el) => {
        const k = el.getAttribute("data-i18n")!;
        if (dict[k]) el.textContent = dict[k];
      });
      langButtons.forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
      document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
    };
    langButtons.forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang!)));
    const nav = (navigator.language || "pt").slice(0, 2);
    setLang(["pt", "en", "es"].includes(nav) ? nav : "en");

    const prevLang = document.documentElement.lang;
    return () => {
      document.body.classList.remove("bio-page");
      document.documentElement.lang = prevLang;
      container.innerHTML = "";
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>SalbCare | International Health Hub</title>
        <meta name="description" content="Connect with trusted healthcare professionals, travel assistance and exclusive partners across Brazil's top kitesurf destinations." />
        <meta property="og:title" content="SalbCare | International Health Hub" />
        <meta property="og:description" content="Connect with trusted healthcare professionals, travel assistance and exclusive partners across Brazil's top kitesurf destinations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://salbcare.com/bio" />
        <link rel="canonical" href="https://salbcare.com/bio" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gloock&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
        <style>{CSS}</style>
      </Helmet>
      <div id="bio-mount" />
    </>
  );
}
