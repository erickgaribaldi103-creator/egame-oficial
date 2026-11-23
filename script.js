    // 00 — CONFIGURACIÓN PÚBLICA DEL SISTEMA DE APORTACIONES
    // SOLO URLs públicas y datos destinados a mostrarse. Nunca contraseñas ni claves API.
    // Crear UN enlace de PayPal y UN enlace de Mercado Pago para CADA nivel fijo.
    const EGAME_CONTRIBUCIONES = {
      correoEGAME: '', // Ejemplo: aportaciones@tudominio.com (poner el real)
      spei: { banco: '', beneficiario: '', clabe: '' },
      links: {
        aliado:        { paypal: '', mercadoPago: '' },  // $50 MXN
        impulsor:      { paypal: '', mercadoPago: '' },  // $150 MXN
        patrocinador:   { paypal: '', mercadoPago: '' },  // $300 MXN
        fundador:       { paypal: '', mercadoPago: '' },  // $500 MXN
        libre:          { paypal: '', mercadoPago: '' }   // pago de importe variable, si proveedor lo admite
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
    const menuToggle=document.getElementById('menuToggle');
    const mainNav=document.getElementById('mainNav');
    menuToggle.addEventListener('click',()=>{const expanded=menuToggle.getAttribute('aria-expanded')==='true';menuToggle.setAttribute('aria-expanded',String(!expanded));mainNav.classList.toggle('open',!expanded);});
    mainNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mainNav.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');}));
    document.getElementById('year').textContent=new Date().getFullYear();

    // 02 — Funciones compartidas de ventanas emergentes
    let activeModal=null,restoreFocus=null;
    function openModal(id){if(activeModal)closeModal(activeModal,false);restoreFocus=document.activeElement;activeModal=document.getElementById(id);activeModal.classList.add('open');document.body.style.overflow='hidden';activeModal.querySelector('.modal-close')?.focus();}
    function closeModal(el,focus=true){if(typeof el==='string')el=document.getElementById(el);if(!el)return;el.classList.remove('open');if(activeModal===el)activeModal=null;document.body.style.overflow='';if(focus&&restoreFocus?.focus)restoreFocus.focus();}
    document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>closeModal(btn.dataset.close)));
    document.querySelectorAll('.modal-backdrop').forEach(backdrop=>backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeModal(backdrop);}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeModal)closeModal(activeModal);});

    // 03 — Cada nivel abre el mismo formulario, pero con su importe y enlaces propios.
    let contribution = null;
    const money = n => new Intl.NumberFormat('es-MX', {style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n)+' MXN';
    const $ = id => document.getElementById(id);
    const trustedLink = (text, domains) => {
      try {
        const u=new URL(text);
        if(u.protocol==='https:' && domains.some(d=>u.hostname===d||u.hostname.endsWith('.'+d))) return u.href;
      } catch { /* La URL aún no se configuró. */ }
      return '';
    };
    function createReference(code) {
      const date=new Date();
      const ymd=date.getFullYear().toString()+String(date.getMonth()+1).padStart(2,'0')+String(date.getDate()).padStart(2,'0');
      const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const digits=new Uint8Array(6);
      if(globalThis.crypto?.getRandomValues) crypto.getRandomValues(digits);
      else for(let i=0;i<digits.length;i++)digits[i]=Math.floor(Math.random()*256);
      return 'EG-'+code+'-'+ymd+'-'+Array.from(digits,x=>alphabet[x%alphabet.length]).join('');
    }
    function startContribution(level) {
      const data=EGAME_NIVELES[level];
      if(!data)return;
      contribution={level, email:'', amount:data.importe, reference:'', folio:''};
      $('checkoutLevel').textContent=data.nombre;
      $('freeAmountWrap').hidden=data.importe!==null;
      $('checkoutAmount').textContent=data.importe===null?'A elegir':money(data.importe);
      $('freeAmount').value='100';
      $('supporterEmail').value='';
      $('supporterConsent').checked=false;
      $('checkoutError').hidden=true;
      $('checkoutMethods').hidden=true;
      $('paymentFolio').value='';
      $('paymentProvider').value='PayPal';
      $('prepareContribution').hidden=false;
      openModal('checkoutBackdrop');
      $('supporterEmail').focus();
    }
    document.querySelectorAll('.choose-contribution').forEach(b=>b.addEventListener('click',()=>startContribution(b.dataset.level)));
    function updateMethodLinks() {
      const config=EGAME_CONTRIBUCIONES.links[contribution.level];
      [
        ['checkoutPaypal','checkoutPaypalStatus', config.paypal,['paypal.com','paypal.me']],
        ['checkoutMercado','checkoutMercadoStatus', config.mercadoPago,['mercadopago.com.mx','mercadopago.com','mpago.la']]
      ].forEach(([linkId,statusId,raw,domains])=>{
        const url=trustedLink(raw,domains);
        const a=$(linkId);a.hidden=!url;a.removeAttribute('href');
        if(url)a.href=url;
        $(statusId).hidden=!!url;
      });
      const bank=EGAME_CONTRIBUCIONES.spei;
      const clabe=bank.clabe.replace(/\s/g,'');
      const valid=Boolean(bank.banco && bank.beneficiario && /^\d{18}$/.test(clabe));
      $('speiCheckoutDetails').hidden=!valid;
      $('checkoutSpeiStatus').hidden=valid;
      if(valid){$('checkoutBank').textContent=bank.banco;$('checkoutBeneficiary').textContent=bank.beneficiario;$('checkoutClabe').textContent=clabe;}
    }
    function emailMessage() {
      const c=contribution;
      return 'Hola, equipo EGAME.\n\nQuiero solicitar la revisión de mi aportación.\n'+
        'Correo del colaborador: '+c.email+'\nNivel: '+EGAME_NIVELES[c.level].nombre+
        '\nCantidad: '+money(c.amount)+'\nReferencia provisional: '+c.reference+
        '\nMétodo utilizado: '+$('paymentProvider').value+
        '\nFolio de la operación: '+($('paymentFolio').value.trim()||'PENDIENTE DE INFORMAR')+
        '\n\nEntiendo que este correo no confirma el pago y EGAME verificará la operación antes de responder.';
    }
    function updateMailLink() {
      if(!contribution)return;
      const inbox=EGAME_CONTRIBUCIONES.correoEGAME.trim();
      const mailValid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inbox);
      const folioListo=$('paymentFolio').value.trim().length>0;
      $('notifyEgame').hidden=!mailValid||!folioListo;
      $('contactStatus').textContent=!mailValid?'Correo oficial de EGAME por configurar: puedes copiar el aviso para conservarlo.':!folioListo?'Después de pagar, escribe tu folio real para solicitar la revisión por correo.':'Se abrirá tu aplicación de correo. Debes enviar el mensaje; no se envía automáticamente.';
      if(mailValid && folioListo){
        const subject='EGAME | Aviso '+contribution.reference+' | '+EGAME_NIVELES[contribution.level].nombre;
        $('notifyEgame').href='mailto:'+inbox+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(emailMessage());
      } else $('notifyEgame').removeAttribute('href');
    }
    $('prepareContribution').addEventListener('click',()=>{
      if(!contribution)return;
      const email=$('supporterEmail').value.trim();
      const value=contribution.level==='libre'?Number($('freeAmount').value):EGAME_NIVELES[contribution.level].importe;
      let message='';
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))message='Escribe un correo válido.';
      else if(!Number.isInteger(value)||value<1||value>1000000)message='Elige una cantidad entera entre $1 y $1,000,000 MXN.';
      else if(!$('supporterConsent').checked)message='Confirma que aceptas utilizar tu correo para gestionar la contribución.';
      $('checkoutError').textContent=message;
      $('checkoutError').hidden=!message;
      if(message)return;
      contribution.email=email;
      contribution.amount=value;
      contribution.reference=createReference(EGAME_NIVELES[contribution.level].clave);
      $('checkoutAmount').textContent=money(value);
      $('checkoutReference').textContent=contribution.reference;
      $('freeAmount').disabled=true;
      $('supporterEmail').disabled=true;
      $('supporterConsent').disabled=true;
      $('prepareContribution').hidden=true;
      $('checkoutMethods').hidden=false;
      updateMethodLinks();
      updateMailLink();
    });
    document.querySelectorAll('.choose-contribution').forEach(b=>b.addEventListener('click',()=>{
      $('freeAmount').disabled=false;$('supporterEmail').disabled=false;$('supporterConsent').disabled=false;
    }));
    $('paymentFolio').addEventListener('input',updateMailLink);
    $('paymentProvider').addEventListener('change',updateMailLink);
    async function safeCopy(text) {
      try {if(!navigator.clipboard?.writeText) throw Error('Sin portapapeles');await navigator.clipboard.writeText(text);}
      catch {window.prompt('Copia este texto:',text);}
    }
    $('copyReference').addEventListener('click',()=>safeCopy(contribution?.reference||''));
    $('copyCheckoutClabe').addEventListener('click',()=>safeCopy(EGAME_CONTRIBUCIONES.spei.clabe.replace(/\s/g,'')));
    $('copyNotice').addEventListener('click',async()=>{
      if(!contribution)return;
      const msg=emailMessage();
      try {await navigator.clipboard.writeText(msg);$('contactStatus').textContent='Aviso copiado. Conserva el texto para enviarlo a EGAME.';}
      catch {window.prompt('Copia este aviso:',msg);}
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
  

