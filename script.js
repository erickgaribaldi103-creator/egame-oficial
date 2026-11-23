    // 00 — CONFIGURACIÓN PÚBLICA: SOLO SPEI + WHATSAPP
    // Editar únicamente estos datos públicos antes de publicar en GitHub.
    // Nunca publicar contraseñas, tokens, NIP, números de tarjeta ni claves API.
    const EGAME_CONTRIBUCIONES = {
      recepcionActiva: false, // cambiar a true SOLO al tener SPEI, WhatsApp y aviso de privacidad listos
      whatsapp: '',           // ejemplo de formato (no número real): 525512345678
      spei: {
        banco: '',           // nombre de tu banco
        beneficiario: '',    // nombre legal del titular (será visible públicamente)
        clabe: ''             // 18 dígitos
      }
    };

    const EGAME_NIVELES = {
      libre: { nombre: 'Aportación voluntaria', importe: null, clave: 'LIB' },
      aliado: { nombre: 'Aliado', importe: 50, clave: 'ALI' },
      impulsor: { nombre: 'Impulsor', importe: 150, clave: 'IMP' },
      patrocinador: { nombre: 'Patrocinador', importe: 300, clave: 'PAT' },
      fundador: { nombre: 'Fundador', importe: 500, clave: 'FUN' }
    };

    // 01 — Navegación móvil
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      mainNav.classList.toggle('open', !expanded);
    });
    mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));
    document.getElementById('year').textContent = new Date().getFullYear();

    // 02 — Ventanas emergentes
    let activeModal = null, restoreFocus = null;
    function openModal(id) {
      if (activeModal) closeModal(activeModal, false);
      restoreFocus = document.activeElement;
      activeModal = document.getElementById(id);
      activeModal.classList.add('open');
      document.body.style.overflow = 'hidden';
      activeModal.querySelector('.modal-close')?.focus();
    }
    function closeModal(el, focus = true) {
      if (typeof el === 'string') el = document.getElementById(el);
      if (!el) return;
      el.classList.remove('open');
      if (activeModal === el) activeModal = null;
      document.body.style.overflow = '';
      if (focus && restoreFocus?.focus) restoreFocus.focus();
    }
    document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', e => {
      if (e.target === backdrop) closeModal(backdrop);
    }));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && activeModal) closeModal(activeModal);
    });

    // 03 — SPEI + solicitud manual por WhatsApp, vinculada a cada nivel
    const $ = id => document.getElementById(id);
    const money = n => new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN', maximumFractionDigits: 0
    }).format(n) + ' MXN';
    const cleanClabe = () => EGAME_CONTRIBUCIONES.spei.clabe.replace(/\s/g, '');
    const phone = () => EGAME_CONTRIBUCIONES.whatsapp.replace(/\D/g, '');
    const validBank = () => Boolean(
      EGAME_CONTRIBUCIONES.spei.banco.trim() &&
      EGAME_CONTRIBUCIONES.spei.beneficiario.trim() &&
      /^\d{18}$/.test(cleanClabe())
    );
    const validWhatsapp = () => /^52\d{10}$/.test(phone());
    const systemReady = () => EGAME_CONTRIBUCIONES.recepcionActiva && validBank() && validWhatsapp();
    $('campaignBadge').textContent = systemReady()
      ? 'Contribuciones SPEI habilitadas · revisión manual'
      : 'Contribuciones SPEI en preparación';

    let contribution = null;
    function createReference(code) {
      const now = new Date();
      const ymd = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const digits = new Uint8Array(6);
      if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(digits);
      else for (let i = 0; i < digits.length; i++) digits[i] = Math.floor(Math.random() * 256);
      return 'EG-' + code + '-' + ymd + '-' + Array.from(digits, x => alphabet[x % alphabet.length]).join('');
    }
    function startContribution(level) {
      const selected = EGAME_NIVELES[level];
      if (!selected) return;
      contribution = { level, nombre: '', email: '', amount: selected.importe, reference: '' };
      $('checkoutLevel').textContent = selected.nombre;
      $('checkoutAmount').textContent = selected.importe === null ? 'A elegir' : money(selected.importe);
      $('freeAmountWrap').hidden = selected.importe !== null;
      $('freeAmount').value = '100';
      $('freeAmount').disabled = false;
      $('supporterName').value = '';
      $('supporterEmail').value = '';
      $('supporterName').disabled = false;
      $('supporterEmail').disabled = false;
      $('supporterConsent').checked = false;
      $('supporterConsent').disabled = false;
      $('paymentFolio').value = '';
      $('transferDate').value = '';
      $('proofReady').checked = false;
      $('checkoutError').hidden = true;
      $('checkoutMethods').hidden = true;
      $('prepareContribution').hidden = false;
      openModal('checkoutBackdrop');
      $('supporterName').focus();
    }
    document.querySelectorAll('.choose-contribution').forEach(btn =>
      btn.addEventListener('click', () => startContribution(btn.dataset.level))
    );
    function whatsappMessage() {
      if (!contribution) return '';
      const c = contribution;
      return [
        'Hola, EGAME. Solicito revisión de mi aportación SPEI y certificado digital.',
        '',
        'Nombre completo: ' + c.nombre,
        'Correo para certificado: ' + c.email,
        'Nivel: ' + EGAME_NIVELES[c.level].nombre,
        'Importe: ' + money(c.amount),
        'Referencia EGAME: ' + c.reference,
        'Clave de rastreo / folio: ' + $('paymentFolio').value.trim(),
        'Fecha de transferencia: ' + $('transferDate').value,
        '',
        'ADJUNTO LA FOTO LEGIBLE DEL COMPROBANTE SPEI EN ESTE CHAT.',
        'Entiendo que la imagen no valida el pago y que EGAME verificará el depósito antes de emitir el certificado.'
      ].join('\n');
    }
    function updateWhatsapp() {
      if (!contribution) return;
      const folioReady = $('paymentFolio').value.trim().length >= 4;
      const dateReady = Boolean($('transferDate').value);
      const proofReady = $('proofReady').checked;
      const enable = systemReady() && folioReady && dateReady && proofReady;
      $('openWhatsapp').disabled = !enable;
      $('copyNotice').disabled = !folioReady || !dateReady;
      $('contactStatus').textContent = !systemReady()
        ? 'El sistema no está activo: falta configurar datos SPEI, WhatsApp y activar la recepción.'
        : !folioReady || !dateReady
          ? 'Después de transferir, escribe tu clave de rastreo y la fecha del SPEI.'
          : !proofReady
            ? 'Confirma que adjuntarás manualmente una foto del comprobante en WhatsApp.'
            : 'El botón abre WhatsApp con tu mensaje preparado. Adjunta la foto y presiona Enviar. No se envía automáticamente.';
    }
    $('prepareContribution').addEventListener('click', () => {
      if (!contribution) return;
      const name = $('supporterName').value.trim().replace(/\s+/g, ' ');
      const email = $('supporterEmail').value.trim();
      const value = contribution.level === 'libre'
        ? Number($('freeAmount').value)
        : EGAME_NIVELES[contribution.level].importe;
      let error = '';
      if (name.length < 3) error = 'Escribe tu nombre completo para el reconocimiento.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = 'Escribe un correo electrónico válido.';
      else if (!Number.isInteger(value) || value < 1 || value > 1000000) error = 'Elige una cantidad entera de $1 a $1,000,000 MXN.';
      else if (!$('supporterConsent').checked) error = 'Confirma que leíste cómo se utilizarán los datos para gestionar tu solicitud.';
      $('checkoutError').textContent = error;
      $('checkoutError').hidden = !error;
      if (error) return;

      contribution.nombre = name;
      contribution.email = email;
      contribution.amount = value;
      contribution.reference = createReference(EGAME_NIVELES[contribution.level].clave);
      $('checkoutAmount').textContent = money(value);
      $('checkoutReference').textContent = contribution.reference;
      $('speiAmount').textContent = money(value);
      $('freeAmount').disabled = true;
      $('supporterName').disabled = true;
      $('supporterEmail').disabled = true;
      $('supporterConsent').disabled = true;
      $('prepareContribution').hidden = true;
      $('checkoutMethods').hidden = false;

      const bank = EGAME_CONTRIBUCIONES.spei;
      $('speiCheckoutDetails').hidden = !systemReady();
      $('checkoutSpeiStatus').hidden = systemReady();
      if (systemReady()) {
        $('checkoutBank').textContent = bank.banco;
        $('checkoutBeneficiary').textContent = bank.beneficiario;
        $('checkoutClabe').textContent = cleanClabe();
      }
      updateWhatsapp();
    });
    ['paymentFolio','transferDate'].forEach(id => $(id).addEventListener('input', updateWhatsapp));
    $('proofReady').addEventListener('change', updateWhatsapp);

    async function safeCopy(text) {
      try {
        if (!navigator.clipboard?.writeText) throw Error('Portapapeles no disponible');
        await navigator.clipboard.writeText(text);
      } catch {
        window.prompt('Copia este texto:', text);
      }
    }
    $('copyReference').addEventListener('click', () => safeCopy(contribution?.reference || ''));
    $('copyCheckoutClabe').addEventListener('click', () => safeCopy(cleanClabe()));
    $('copyNotice').addEventListener('click', () => safeCopy(whatsappMessage()));
    $('openWhatsapp').addEventListener('click', () => {
      if (!contribution || !systemReady() || !$('proofReady').checked || !$('paymentFolio').value.trim() || !$('transferDate').value) return;
      // WhatsApp permite texto prellenado, pero NO adjunta fotos automáticamente.
      const url = 'https://wa.me/' + phone() + '?text=' + encodeURIComponent(whatsappMessage());
      window.open(url, '_blank', 'noopener,noreferrer');
    });

    // 04 — Fichas de las divisiones EGAME
    const projects={
      noticias:{name:'NOTICIAS EGAME',status:'En planeación',description:'Portal de información sobre actualidad, tecnología, sociedad y temas relevantes. Una sección editorial propia dentro del ecosistema EGAME.',features:['Portada de noticias y categorías temáticas','Buscador y páginas por artículo','Diseño adaptable a computadoras y móviles']},
      espectaculos:{name:'ESPECTÁCULOS EGAME',status:'En planeación',description:'Espacio digital de cultura y entretenimiento: música, televisión, cine, lanzamientos, artistas y eventos.',features:['Noticias y artículos especializados','Cobertura de estrenos y eventos','Galerías y contenidos audiovisuales']},
      deportes:{name:'DEPORTES GAME',status:'En planeación',description:'Portal de información deportiva con énfasis en fútbol, calendarios, resultados y tablas de posiciones.',features:['Noticias y cobertura por disciplina','Partidos, calendarios y clasificaciones','Estadísticas y perfiles deportivos']},
      radio:{name:'RADIO GAME',status:'En desarrollo',description:'Plataforma de radio por internet y programación digital, con una experiencia de escucha diseñada para la comunidad.',features:['Reproductor de transmisiones en vivo','Programación y contenido destacado','Servicios y acceso de usuarios según evolucione el proyecto']},
      apuestas:{name:'APUESTAS GAME',status:'Futuro',description:'Concepto de análisis y pronósticos deportivos. El alcance inicial previsto es informativo; una operación con dinero real requeriría un proyecto regulatorio independiente.',features:['Análisis de eventos deportivos','Datos históricos y estadísticas','Pronósticos informativos, sin apuestas reales en esta fase']},
      ajedrez:{name:'AJEDREZ GAME',status:'En desarrollo',description:'Plataforma de juego de ajedrez que busca ofrecer partidas en línea y una experiencia competitiva entre integrantes de la comunidad.',features:['Tablero y mecánicas de ajedrez','Perfiles y partidas multijugador en fases futuras','Estadísticas, rankings y torneos a futuro']},
      delivery:{name:'DELIVERY GAME',status:'En desarrollo',description:'Videojuego de entregas y conducción: inicia como experiencia 2D y tiene una visión de evolución a mundo abierto 3D.',features:['Misiones de recolección y entrega','Vehículos, ciudades, mejoras y progresión','Expansión hacia 3D y multijugador']},
      games:{name:'EGAME GAMES',status:'Expansión futura',description:'Una biblioteca de videojuegos originales que crecerá con nuevos conceptos y lanzamientos para distintas plataformas.',features:['Catálogo de juegos y versiones','Páginas individuales y bitácoras de avances','Futuras demos y descargas oficiales']}
    };
    document.querySelectorAll('.detail-btn').forEach(btn=>btn.addEventListener('click',()=>{const p=projects[btn.dataset.project];document.getElementById('projectTitle').textContent=p.name;document.getElementById('projectStatus').textContent=p.status;document.getElementById('projectDescription').textContent=p.description;const features=document.getElementById('projectFeatures');features.replaceChildren();p.features.forEach(t=>{const d=document.createElement('div'),s=document.createElement('span');s.textContent='✓';s.style.color='#6bdfa9';d.append(s,document.createTextNode(t));features.append(d);});openModal('projectBackdrop');}));
    document.getElementById('projectSupport').addEventListener('click',()=>{closeModal('projectBackdrop');document.getElementById('apoyar').scrollIntoView({behavior:'smooth'});});
  

