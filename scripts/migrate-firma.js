// TAMAMLANDI (2026-07-30) — bu script prodüksiyonda bir kez çalıştırıldı ve
// tüm mevcut users/sessions/sayimciGorevler dokümanlarına 'firma' alanı
// eklendi. Nihai sıkı firestore.rules artık canlıda olduğundan bu script BİR
// DAHA ÇALIŞMAZ (aşağıdaki gibi): normal bir yönetici artık tüm 'users'
// koleksiyonunu filtresiz listeleyemiyor (permission-denied) — bu, izolasyonun
// doğru çalıştığının kanıtı. Referans/gelecekteki benzer migrasyonlar için
// tutulan tarihi bir kayıt olarak bırakılıyor.
//
// Çalıştırma (o zamanki hali): node scripts/migrate-firma.js        (dry-run)
//                               node scripts/migrate-firma.js --apply (gerçek yazım)
//
// Not: firebase-admin SDK yerine client SDK + MIGRATION_EMAIL/MIGRATION_PASSWORD
// (.env, gitignore'da) ile giriş kullanıldı — o ortamda Application Default
// Credentials kurulamamıştı. Script çalıştırılmadan önce firestore.rules'a
// GEÇİCİ olarak "firmalar" koleksiyonu için yazma izni eklenip deploy edilmişti,
// migrasyon bitince nihai sıkı kurallar deploy edildi.

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  getFirestore, collection, collectionGroup, doc, getDocs, setDoc, writeBatch,
} from 'firebase/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DRY_RUN = !process.argv.includes('--apply')

const SPECIAL_USERS = {
  'admin@epsonsayim.com':             { firma: 'epson', rol: 'yonetici' },
  'taskin.tasci@alisanlogistics.com': { firma: null,    rol: 'superadmin' },
}
const DEFAULT_FIRMA = 'akkim'
const BATCH_LIMIT = 480

function loadEnv() {
  const text = readFileSync(join(__dirname, '..', '.env'), 'utf8')
  const env = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

async function commitInBatches(db, ops) {
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const chunk = ops.slice(i, i + BATCH_LIMIT)
    if (!DRY_RUN) {
      const batch = writeBatch(db)
      chunk.forEach(({ ref, data }) => batch.set(ref, data, { merge: true }))
      await batch.commit()
    }
  }
}

async function main() {
  console.log(DRY_RUN ? '── DRY RUN (yazma yok) ──' : '── GERÇEK ÇALIŞTIRMA (Firestore güncellenecek) ──')

  const env = loadEnv()
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  })
  const migEmail = env.MIGRATION_EMAIL
  const migPassword = env.MIGRATION_PASSWORD
  if (!migEmail || !migPassword) {
    throw new Error('.env dosyasına MIGRATION_EMAIL ve MIGRATION_PASSWORD ekleyin (yonetici yetkili bir hesap).')
  }
  const auth = getAuth(app)
  await signInWithEmailAndPassword(auth, migEmail, migPassword)
  const db = getFirestore(app)

  // ── 1) firmalar dokümanları ──────────────────────────────────────────────
  console.log('\n[1/4] firmalar/akkim, firmalar/epson')
  const firmaDocs = [
    { id: 'akkim', data: { ad: 'Akkim', unvan: 'AKKİM KİMYA SAN. TİC. A.Ş.', sablon: 'standart', aktif: true, createdBy: 'migration' } },
    { id: 'epson', data: { ad: 'Epson', unvan: 'EPSON MİDDLE EAST FZCO',      sablon: 'wms31',    aktif: true, createdBy: 'migration' } },
  ]
  for (const f of firmaDocs) {
    console.log('  ->', f.id, JSON.stringify(f.data))
    if (!DRY_RUN) await setDoc(doc(db, 'firmalar', f.id), { ...f.data, createdAt: new Date() }, { merge: true })
  }

  // ── 2) users → firma/rol backfill ────────────────────────────────────────
  console.log('\n[2/4] users')
  const usersSnap = await getDocs(collection(db, 'users'))
  const uidToFirma = {}
  const userOps = []
  usersSnap.forEach(d => {
    const data = d.data()
    const email = data.email
    let target
    if ('firma' in data) {
      target = { firma: data.firma, rol: data.rol } // zaten migrate edilmiş
    } else if (email && SPECIAL_USERS[email]) {
      target = SPECIAL_USERS[email]
    } else {
      target = { firma: DEFAULT_FIRMA, rol: data.rol || 'sayimci' }
    }
    uidToFirma[d.id] = target.firma
    const alreadyDone = 'firma' in data
    console.log(`  ${alreadyDone ? '(atlandı, zaten var)' : '->'} ${d.id} ${email} : firma=${target.firma} rol=${target.rol}`)
    if (!alreadyDone) {
      userOps.push({ ref: doc(db, 'users', d.id), data: { firma: target.firma, rol: target.rol } })
    }
  })
  await commitInBatches(db, userOps)

  // ── 3) sessions → ÖNCE importFormat'tan (hangi Excel şablonu yüklendiği
  // gerçek bir sinyal), yoksa creator'ın firmasından firma belirle ─────────
  // Not: importFormat öncelikli çünkü bir kullanıcı (örn. süper yönetici
  // olacak hesap) hem Akkim hem Epson oturumu oluşturmuş olabilir — creator
  // uid'si tek başına yanıltıcı olabilir.
  console.log('\n[3/4] sessions')
  const sessionsSnap = await getDocs(collection(db, 'sessions'))
  const sessionToFirma = {}
  const sessionOps = []
  sessionsSnap.forEach(d => {
    const data = d.data()
    if ('firma' in data) {
      sessionToFirma[d.id] = data.firma
      console.log(`  (atlandı, zaten var) ${d.id} : firma=${data.firma}`)
      return
    }
    const creatorUid = data.createdBy
    let firma
    let kaynak
    if (data.importFormat === 'wms31') {
      firma = 'epson'; kaynak = 'importFormat=wms31'
    } else if (data.importFormat === 'rapor5' || data.importFormat === 'sku') {
      firma = 'akkim'; kaynak = `importFormat=${data.importFormat}`
    } else if (creatorUid in uidToFirma && uidToFirma[creatorUid]) {
      firma = uidToFirma[creatorUid]; kaynak = 'createdBy firması'
    } else {
      firma = DEFAULT_FIRMA; kaynak = 'varsayılan (importFormat yok, creator firması belirsiz)'
      console.warn(`  !! UYARI: session ${d.id} için kesin sinyal yok, '${DEFAULT_FIRMA}' varsayıldı — manuel kontrol edin`)
    }
    sessionToFirma[d.id] = firma
    console.log(`  -> ${d.id} (${data.depoAdi || ''}) : firma=${firma} [${kaynak}]`)
    sessionOps.push({ ref: doc(db, 'sessions', d.id), data: { firma } })
  })
  await commitInBatches(db, sessionOps)

  // ── 4) sayimciGorevler (collectionGroup) → ebeveyn session'ın firmasını miras al
  console.log('\n[4/4] sayimciGorevler (collectionGroup)')
  const gorevSnap = await getDocs(collectionGroup(db, 'sayimciGorevler'))
  const gorevOps = []
  gorevSnap.forEach(d => {
    const data = d.data()
    if ('firma' in data) {
      console.log(`  (atlandı, zaten var) ${d.ref.path}`)
      return
    }
    const sessionId = data.sessionId || d.ref.parent.parent.id
    let firma = sessionToFirma[sessionId]
    if (!firma) {
      console.warn(`  !! UYARI: oturum firması bulunamadı (öksüz görev?): ${d.ref.path} -> varsayılan '${DEFAULT_FIRMA}'`)
      firma = DEFAULT_FIRMA
    }
    console.log(`  -> ${d.ref.path} : firma=${firma}`)
    gorevOps.push({ ref: d.ref, data: { firma } })
  })
  await commitInBatches(db, gorevOps)

  // ── Özet ──────────────────────────────────────────────────────────────────
  console.log('\n── ÖZET ──')
  const firmaCounts = {}
  Object.values(uidToFirma).forEach(f => { firmaCounts[f] = (firmaCounts[f] || 0) + 1 })
  console.log('users firma dağılımı:', firmaCounts)
  const sessionFirmaCounts = {}
  Object.values(sessionToFirma).forEach(f => { sessionFirmaCounts[f] = (sessionFirmaCounts[f] || 0) + 1 })
  console.log('sessions firma dağılımı:', sessionFirmaCounts)
  console.log('toplam users:', usersSnap.size, '| toplam sessions:', sessionsSnap.size, '| toplam gorevler:', gorevSnap.size)
  console.log(DRY_RUN ? '\n(Dry-run tamamlandı — hiçbir şey yazılmadı. Gerçek çalıştırma için: node scripts/migrate-firma.js --apply)' : '\nMigrasyon tamamlandı.')

  process.exit(0)
}

main().catch(err => { console.error('HATA:', err); process.exit(1) })
