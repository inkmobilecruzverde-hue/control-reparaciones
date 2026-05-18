"use client";
import { QRCodeCanvas } from "qrcode.react";
import SignatureCanvas from "react-signature-canvas";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRef } from "react";
import { useState, useEffect } from "react";
import { db, auth } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
collection,
addDoc,
getDocs,
updateDoc,
deleteDoc,
doc,
} from "firebase/firestore";

type Orden = {
id: string;
numero?: string;
nombre: string;
telefono: string;
dni?: string;
modelo: string;
serie?: string;
problema: string;
codigo?: string;
notas?: string;
presupuesto?: string;
coste?: string;
estado: string;
fecha?: any;
firma?: string | null;
fechaEntrega?: any;
etiqueta?: string;
};

export default function Home() {
const [ordenes, setOrdenes] = useState<Orden[]>([]);
const [busqueda, setBusqueda] = useState("");
const [filtroEstado, setFiltroEstado] = useState("TODOS");
const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null);
const router = useRouter();
const [checkingAuth, setCheckingAuth] = useState(true);
const [mesSeleccionado, setMesSeleccionado] =
  useState(new Date().getMonth());

const [añoSeleccionado, setAñoSeleccionado] =
  useState(new Date().getFullYear());

const [form, setForm] = useState({
nombre: "",
telefono: "",
dni: "",
modelo: "",
serie: "",
problema: "",
codigo: "",
notas: "",
presupuesto: "",
coste: "",
estado: "RECIBIDO",
etiqueta: "",
tecnico: "Rubén",
});
const firmaRef = useRef<any>(null);
const [mostrarScanner, setMostrarScanner] =
  useState(false);
  const [etiquetaSeleccionada, setEtiquetaSeleccionada] =
  useState<Orden | null>(null);
const estados = ["RECIBIDO", "EN REVISION", "ESPERANDO RECAMBIO", "ESPERANDO ACEPTACION", "FINALIZADO", "ENTREGADO"];
const etiquetas = [
  "NORMAL",
  "URGENTE",
  "GARANTÍA",
  "ESPERANDO PIEZA",
  "SIN ARREGLO",
];
<SignatureCanvas
  ref={firmaRef}
  penColor="black"
  canvasProps={{
    width: 450,
    height: 150,
    className: "border w-full bg-white",
  }}
/>

// 🔒 ESC + bloqueo scroll
useEffect(() => {
const handleEsc = (e: KeyboardEvent) => {
if (e.key === "Escape") setOrdenSeleccionada(null);
};


if (ordenSeleccionada) {
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", handleEsc);
} else {
  document.body.style.overflow = "auto";
}

return () => window.removeEventListener("keydown", handleEsc);


}, [ordenSeleccionada]);

const generarNumero = () => {
const año = new Date().getFullYear();
const timestamp = Date.now().toString().slice(-6);
return `${año}-${timestamp}`;
};

const cargarOrdenes = async () => {
  const snapshot = await getDocs(
    collection(db, "ordenes")
  );

  const datos: Orden[] = snapshot.docs.map((docu) => ({
    id: docu.id,
    ...(docu.data() as Omit<Orden, "id">),
  }));

  datos.sort(
    (a, b) =>
      new Date(b.fecha || 0).getTime() -
      new Date(a.fecha || 0).getTime()
  );

  setOrdenes(datos);
};

useEffect(() => {
cargarOrdenes();
}, []);
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user) {
      router.push("/login");
    } else {
      setCheckingAuth(false);
    }
  });

  return () => {
    unsubscribe();
  };
}, [router]);

const crearOrden = async () => {
if (!form.nombre || !form.telefono) return;


await addDoc(collection(db, "ordenes"), {
  ...form,
  numero: generarNumero(),
  fecha: new Date().toISOString(),
});

setForm({
  nombre: "",
  telefono: "",
  dni: "",
  modelo: "",
  serie: "",
  problema: "",
  codigo: "",
  notas: "",
  presupuesto: "",
  coste: "",
  estado: "RECIBIDO",
  etiqueta: "",
  
});

cargarOrdenes();


};

const cambiarEstado = async (
  id: string,
  estado: string
) => {

  const datos: any = {
    estado,
  };

  if (estado === "ENTREGADO") {
    datos.fechaEntrega = new Date().toISOString();
  }

  await updateDoc(doc(db, "ordenes", id), datos);

  cargarOrdenes();
};

const eliminarOrden = async (id: string) => {
if (!confirm("¿Eliminar orden?")) return;
await deleteDoc(doc(db, "ordenes", id));
cargarOrdenes();
};

const enviarWhatsApp = (orden: Orden) => {

  const numeroLimpio = orden.telefono
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/\(/g, "")
    .replace(/\)/g, "");

  const numeroFinal = numeroLimpio.startsWith("34")
    ? numeroLimpio
    : `34${numeroLimpio}`;

  let msg = "";

if (orden.estado === "RECIBIDO") {
  msg = `Hola ${orden.nombre} 👋

Hemos recibido tu ${orden.modelo}

IMEI/Nº Serie:
${orden.serie || "-"}

Tu orden ya ha sido registrada correctamente.
🔎 Consulta el estado aquí:
https://https://ink-mobile-app-kbu6-bpf46a46j-inkmobilecruzverde-6483s-projects.vercel.app//consulta?telefono=${orden.telefono}&orden=${orden.numero}

🛠️ Ink-Mobile`;
}

else if (orden.estado === "ESPERANDO ACEPTACION") {
  msg = `Hola ${orden.nombre} 👋

Tu ${orden.modelo} ya ha sido revisado.

Presupuesto reparación:
${orden.presupuesto || "-"} €

Quedamos pendientes de tu aceptación para continuar.

🛠️ Ink-Mobile`;
}

else if (orden.estado === "FINALIZADO") {
  msg = `Hola ${orden.nombre} 👋

Tu ${orden.modelo}
ya está reparado y listo para entregar.

🛠️ Ink-Mobile`;
}

else {
  msg = `Hola ${orden.nombre} 👋

El estado actual de tu equipo es:

${orden.estado}

🛠️ Ink-Mobile`;
}

  window.open(
    `https://api.whatsapp.com/send?phone=${numeroFinal}&text=${encodeURIComponent(msg)}`,
    "_blank"
  );
};

const compartirOrden = async (orden: Orden) => {

  const texto = `
🛠️ Ink-Mobile

Orden: ${orden.numero}

Cliente: ${orden.nombre}

Modelo: ${orden.modelo}

Problema:
${orden.problema}

Estado: ${orden.estado}
  `;

  try {

    if (navigator.share) {

      await navigator.share({
        title: `Orden ${orden.numero}`,
        text: texto,
      });

    } else {

      alert("Tu navegador no soporta compartir");

    }

  } catch (error) {
    console.log(error);
  }
};

const guardarEdicion = async () => {
if (!ordenSeleccionada) return;


const firma =
  firmaRef.current &&
  typeof (firmaRef.current as any).getTrimmedCanvas === "function"
    ? (firmaRef.current as any)
        .getTrimmedCanvas()
        .toDataURL("image/png")
    : "";
const datosActualizados = {
  ...ordenSeleccionada,
  firma: firma || "",
};

const { id, ...datos } = datosActualizados;

await updateDoc(doc(db, "ordenes", id), datos as any);

  setOrdenSeleccionada(null);
  cargarOrdenes();
};
const iniciarScanner = () => {

  setMostrarScanner(true);

  setTimeout(() => {

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      (texto) => {

        setForm({
          ...form,
          serie: texto,
        });

        scanner.clear();

        setMostrarScanner(false);

      },
      () => {}
    );

  }, 300);
};
const imprimirOrden = (orden: Orden) => {
const ventana = window.open("", "_self");
const fecha = new Date(orden.fecha);


ventana?.document.write(`
  <html>

<style>

@media print {

  @page {
    margin: 8mm;
  }

  body {
    margin: 0;
    padding: 0;
  }

  button {
    display: none !important;
  }

}

</style>

    <body style="font-family:Arial;padding:25px;max-width:800px;margin:auto;color:#000;">
      <h2 style="text-align:center">🛠️ Ink-Mobile</h2>

      <div style="text-align:center; font-size:12px;">
        CIF: E56261365<br/>
        C/ CRUZ VERDE Nº22<br/>
        TEL: 600 639 228<br/>
        922 27 68 07
      </div>

      <p><b>Orden:</b> ${orden.numero}</p>
      <p><b>Fecha:</b> ${fecha.toLocaleString()}</p>

      <hr/>

      <p><b>Cliente:</b> ${orden.nombre}</p>
      <p><b>Teléfono:</b> ${orden.telefono}</p>
      <p><b>DNI:</b> ${orden.dni || "-"}</p>

      <hr/>

      <p><b>Modelo:</b> ${orden.modelo}</p>
      <p><b>Problema:</b> ${orden.problema}</p>
      <p><b>Nº Serie:</b> ${orden.serie || "-"}</p>

      <hr/>

      <p><b>Notas:</b> ${orden.notas || "-"}</p>
      <p><b>Presupuesto:</b> ${orden.presupuesto || "-"} €</p>

      <hr/>

      <p><b>Estado:</b> ${orden.estado}</p>

<hr/>

<p><b>Firma cliente:</b></p>

${
  orden.firma
    ? `<img src="${orden.firma}"
        style="width:150px;height:60px;object-fit:contain;border:1px #000;padding:5px;" />`
    : `<div style="height:60px;border-bottom:1px #000;"></div>`
}
      
      
      <br/><br/>
<div style="margin-top:40px;padding-top:15px;border-top:1px solid #ffffff;font-size:9px;line-height:1.5;text-align:justify;width:100%;">

<b>IMPORTANTE:</b> SE TIENE QUE PRESENTAR ESTE RESGUARDO DE DEPÓSITO PARA RETIRAR SU APARATO.
EN CASO DE NO PRESENTARLO, SE DEBE ACREDITAR SU TITULARIDAD ANTE LA EMPRESA.

<br/><br/>

LA GARANTÍA SOLO CUBRE ANTE LA REPARACIÓN EFECTUADA, QUEDANDO EXENTO CUALQUIER FALLO AJENO A DICHA REPARACIÓN.

<br/><br/>

LA VALIDEZ DEL PRESUPUESTO SERÁ DE 3 DÍAS UNA VEZ REALIZADO.

<br/><br/>

UNA VEZ FINALIZADA LA REPARACIÓN SE LE AVISARÁ VÍA TELEFÓNICA O MEDIANTE MENSAJERÍA EXTERNA.

<br/><br/>

PASADO UN MES DESDE LA FECHA DE ENTRADA, EL APARATO EMPEZARÁ A CORRER CON GASTOS DE ALMACENAMIENTO,
PASANDO A NUESTRO DEPÓSITO SIENDO ESTE UN MÁXIMO DE 3 MESES O PASARÁ A SER RECLAMO.

EL SERVICIO TIENE UN COSTE DE 1€ DIARIO A CONTAR PASADOS 30 DÍAS DE LA FECHA DE EMISIÓN DE ESTA ORDEN.

</div>



      <div style="margin-top:30px;text-align:center;">
  <button
    onclick="window.location.href='/'"
    style="
      padding:12px 20px;
      background:#111827;
      color:white;
      border:none;
      border-radius:10px;
      font-size:16px;
    "
  >
    ⬅ Volver
  </button>

  <button
  onclick="
    if (navigator.share) {
      navigator.share({
  title: 'Orden Ink-Mobile',
  text: document.body.innerText
});
    } else {
      alert('Tu navegador no soporta compartir');
    }
  "
  style="
    padding:12px 20px;
    background:#4f46e5;
    color:white;
    border:none;
    border-radius:10px;
    font-size:16px;
    margin-left:10px;
  "
>
  📤 Compartir
</button>

</div>

<script>
  window.onload = () => {
  window.print();

setTimeout(() => {
  window.close();
}, 1000);
</script>
    </body>
  </html>
`);

ventana?.document.close();


};

const total = ordenes.length;
const recibidos = ordenes.filter(o => o.estado === "RECIBIDO").length;
const enRevision = ordenes.filter(
  (o) => o.estado === "EN REVISION"
).length;
const esperandoAceptacion = ordenes.filter(
  (o) => o.estado === "ESPERANDO ACEPTACION"
).length;
const esperandoRecambio = ordenes.filter(
  (o) => o.estado === "ESPERANDO RECAMBIO"
).length;
const finalizadas = ordenes.filter(o => o.estado === "FINALIZADO").length;

const ingresos = ordenes
  .filter((o) => o.estado === "ENTREGADO")
  .reduce(
    (acc, o) =>
      acc + Number(o.presupuesto || 0),
    0
  );

const beneficioReal = ordenes
  .filter((o) => o.estado === "ENTREGADO")
  .reduce(
    (acc, o) =>
      acc +
      (
        Number(o.presupuesto || 0) -
        Number(o.coste || 0)
      ),
    0
  );
const ingresosFiltrados = ordenes
  .filter((o) => {
    if (
      o.estado !== "ENTREGADO" ||
      !o.fechaEntrega
    )
      return false;

    const fecha = new Date(o.fechaEntrega);

    return (
      fecha.getMonth() === mesSeleccionado &&
      fecha.getFullYear() === añoSeleccionado
    );
  })
  .reduce(
    (acc, o) =>
      acc + Number(o.presupuesto || 0),
    0
  );
const filtradas = ordenes.filter((o) => {
const textoBusqueda = busqueda.toLowerCase();

const coincideBusqueda =
  o.nombre?.toLowerCase().includes(textoBusqueda) ||
  o.modelo?.toLowerCase().includes(textoBusqueda) ||
  o.telefono?.toLowerCase().includes(textoBusqueda) ||
  o.dni?.toLowerCase().includes(textoBusqueda) ||
  o.serie?.toLowerCase().includes(textoBusqueda) ||
  o.problema?.toLowerCase().includes(textoBusqueda) ||
  o.notas?.toLowerCase().includes(textoBusqueda);


const coincideEstado =
  filtroEstado === "TODOS" || o.estado === filtroEstado;

return coincideBusqueda && coincideEstado;


});

if (checkingAuth) {
  return (
    <div className="p-10 text-center">
      Cargando...
    </div>
  );
}

return (
<>
  {mostrarScanner && (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">

      <div
        id="reader"
        className="w-full max-w-md bg-white p-2 rounded"
      />

      <button
        onClick={() => setMostrarScanner(false)}
        className="mt-4 bg-red-600 text-white px-6 py-2 rounded"
      >
        Cerrar
      </button>

    </div>
  )}

<div className="p-4 max-w-7xl mx-auto">
      

  <h1 className="text-3xl font-bold mb-4">🛠️ Ink-Mobile</h1>
  <div className="flex gap-2 mb-4">

  <select
    className="border p-2 rounded"
    value={mesSeleccionado}
    onChange={(e) =>
      setMesSeleccionado(Number(e.target.value))
    }
  >
    <option value={0}>Enero</option>
    <option value={1}>Febrero</option>
    <option value={2}>Marzo</option>
    <option value={3}>Abril</option>
    <option value={4}>Mayo</option>
    <option value={5}>Junio</option>
    <option value={6}>Julio</option>
    <option value={7}>Agosto</option>
    <option value={8}>Septiembre</option>
    <option value={9}>Octubre</option>
    <option value={10}>Noviembre</option>
    <option value={11}>Diciembre</option>
  </select>

  <input
    type="number"
    className="border p-2 rounded w-28"
    value={añoSeleccionado}
    onChange={(e) =>
      setAñoSeleccionado(Number(e.target.value))
    }
  />

  <div className="bg-lime-200 px-4 py-2 rounded font-bold">
    💰 € {ingresosFiltrados}
  </div>

</div>

  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
   <div className="bg-blue-100 p-3 rounded text-center">
  Recibidos: {recibidos}
</div>

<div className="bg-yellow-100 p-3 rounded text-center">
  En revisión: {enRevision}
</div>

<div className="bg-orange-100 p-3 rounded text-center">
  Esperando aceptación: {esperandoAceptacion}
</div>

<div className="bg-amber-100 p-3 rounded text-center">
  Esperando recambio: {esperandoRecambio}
</div>

<div className="bg-green-100 p-3 rounded text-center">
  Finalizadas: {finalizadas}
</div>

<div className="bg-gray-200 p-3 rounded text-center">
  Total: {total}
</div>

<div className="bg-emerald-200 p-3 rounded text-center font-bold">
  Beneficio: € {beneficioReal}
</div>

<div className="bg-emerald-200 p-3 rounded text-center">
  € {ingresos}
</div>

</div>

  <div className="flex gap-2 mb-4">
    <input className="border p-2 w-full" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
    <select className="border p-2" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
      <option value="TODOS">Todos</option>
      {estados.map(e => <option key={e}>{e}</option>)}
    </select>
  </div>

  <div className="bg-white p-4 rounded shadow mb-6 space-y-2">
    <input className="border p-2 w-full" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
    <input
  type="tel"
  inputMode="numeric"
  className="border p-2 w-full"
  placeholder="Teléfono"
  value={form.telefono}
  onChange={(e) =>
    setForm({
      ...form,
      telefono: e.target.value,
    })
  }
/>
    <input
  autoCapitalize="characters"
  className="border p-2 w-full"
  placeholder="DNI"
  value={form.dni}
  onChange={(e) =>
    setForm({
      ...form,
      dni: e.target.value.toUpperCase(),
    })
  }
/>
    <input className="border p-2 w-full" placeholder="Modelo" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
    <input className="border p-2 w-full" placeholder="Problema" value={form.problema} onChange={(e) => setForm({ ...form, problema: e.target.value })} />
 <div className="flex gap-2">

  <input
    type="tel"
    inputMode="numeric"
    autoCorrect="off"
    spellCheck={false}
    className="border p-2 w-full"
    placeholder="Nº Serie / IMEI"
    value={form.serie || ""}
    onChange={(e) =>
      setForm({
        ...form,
        serie: e.target.value,
      })
    }
  />

  <button
    type="button"
    onClick={iniciarScanner}
    className="bg-black text-white px-4 rounded"
  >
    📷
  </button>

</div>
    <input className="border p-2 w-full" placeholder="Notas " value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
    <input
  type="number"
  inputMode="decimal"
  className="border p-2 w-full"
  placeholder="Presupuesto (€)"
  value={form.presupuesto}
  onChange={(e) =>
    setForm({
      ...form,
      presupuesto: e.target.value,
    })
  }
/>
<input
  type="number"
  inputMode="decimal"
  className="border p-2 w-full"
  placeholder="Coste pieza (€)"
  value={form.coste || ""}
  onChange={(e) =>
    setForm({
      ...form,
      coste: e.target.value,
    })
  }
/>
    <select className="border p-2 w-full" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
      {estados.map(e => <option key={e}>{e}</option>)}
    </select>
    <select
  className="border p-2 w-full"
  value={form.etiqueta}
  onChange={(e) =>
    setForm({ ...form, etiqueta: e.target.value })
  }
>
  {etiquetas.map((e) => (
    <option key={e}>{e}</option>
  ))}
</select>

    <button onClick={crearOrden} className="bg-blue-600 text-white p-2 w-full">➕ Crear orden</button>
  </div>

  <table className="w-full border hidden md:table">
    <thead>
      <tr>
        <th>Cliente</th>
        <th>Modelo</th>
        <th>Presupuesto</th>
        <th>Estado</th>
        <th></th>
      </tr>
    </thead>

    <tbody>
      {filtradas.map((o) => {

const dias =
  Math.floor(
    (Date.now() - new Date(o.fecha).getTime()) /
    (1000 * 60 * 60 * 24)
  );

return (
  <tr
    key={o.id}
    className={`border ${
      dias > 30
        ? "bg-red-100"
        : dias > 15
        ? "bg-yellow-100"
        : ""
    }`}
  >
          <td>{o.nombre}</td>
          <td>{o.modelo}</td>
          <td>
  <span
    className={`px-2 py-1 rounded text-white text-xs
      ${
        o.etiqueta === "URGENTE"
          ? "bg-red-500"
          : o.etiqueta === "GARANTÍA"
          ? "bg-blue-500"
          : o.etiqueta === "ESPERANDO PIEZA"
          ? "bg-yellow-500"
          : o.etiqueta === "SIN ARREGLO"
          ? "bg-gray-700"
          : "bg-green-500"
      }
    `}
  >
    {o.etiqueta || "NORMAL"}
  </span>
</td>
          <td>{o.presupuesto || "-"} €</td>

          <td>
            <select
              value={o.estado}
              onChange={(e) => cambiarEstado(o.id, e.target.value)}
              className="px-2 py-1 rounded bg-gray-200"
            >
              {estados.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </td>

          <td className="space-x-2">
            <button onClick={() => setOrdenSeleccionada(o)}>👁️</button>
            <button onClick={() => enviarWhatsApp(o)}>📲</button>
            <button
  onClick={() => setEtiquetaSeleccionada(o)}
>
  🏷️
</button>
            <button onClick={() => imprimirOrden(o)}>🧾</button>
            <button onClick={() => eliminarOrden(o.id)}>❌</button>
          </td>
        </tr>
      );
})}
    </tbody>
  </table>
  <div className="md:hidden space-y-4 mt-4">
  {filtradas.map((o) => (
    <div
      key={o.id}
      className={`rounded-xl shadow p-4 border space-y-3 ${
  Math.floor(
    (Date.now() -
      new Date(o.fecha).getTime()) /
      (1000 * 60 * 60 * 24)
  ) > 30
    ? "bg-red-100"
    : Math.floor(
        (Date.now() -
          new Date(o.fecha).getTime()) /
          (1000 * 60 * 60 * 24)
      ) > 15
    ? "bg-yellow-100"
    : "bg-white"
}`}
    >
      <div>
        <p className="text-lg font-bold">{o.nombre}</p>
        <p className="text-sm text-gray-500">{o.modelo}</p>
      </div>

      <div className="flex justify-between text-sm">
        <span>Estado:</span>
        <span className="font-bold">{o.estado}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span>Presupuesto:</span>
        <span>{o.presupuesto || "-"} €</span>
      </div>

      <select
        value={o.estado}
        onChange={(e) => cambiarEstado(o.id, e.target.value)}
        className="w-full border p-2 rounded"
      >
        {estados.map((e) => (
          <option key={e}>{e}</option>
        ))}
      </select>

      <div className="grid grid-cols-3 gap-2 pt-2">
        <button
          onClick={() => setOrdenSeleccionada(o)}
          className="bg-blue-600 active:scale-95 text-white py-3 rounded-xl text-base"
        >
          👁️
        </button>

        <button
  onClick={() => setEtiquetaSeleccionada(o)}
  className="bg-black active:scale-95 text-white py-2 rounded-lg text-base"
>
  🏷️
</button>

        <button
          onClick={() =>
            enviarWhatsApp(o)
          }
          className="bg-green-600 active:scale-95 text-white py-3 rounded-xl text-base"
        >
          📲
        </button>

        <button
          onClick={() => compartirOrden(o)}
          className="bg-indigo-600 active:scale-95 text-white py-3 rounded-xl text-base"
        >
          📤
        </button>

        <button
          onClick={() => imprimirOrden(o)}
          className="bg-gray-800 active:scale-95 text-white py-3 rounded-xl text-base"
        >
          🧾
        </button>

        <button
          onClick={() => eliminarOrden(o.id)}
          className="bg-red-600 active:scale-95 text-white py-3 rounded-xl text-base"
        >
          ❌
        </button>
      </div>
    </div>
  ))}
</div>
{etiquetaSeleccionada && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onClick={() => setEtiquetaSeleccionada(null)}
  >
    <div
      className="bg-white p-4 rounded text-center w-72"
      onClick={(e) => e.stopPropagation()}
    >

      <h2 className="font-bold text-lg">
        🏷️ Ink-Mobile
      </h2>

      <p className="mt-2">
        <b>Orden:</b><br />
        {etiquetaSeleccionada.numero}
      </p>

      <p className="mt-2">
        <b>Cliente:</b><br />
        {etiquetaSeleccionada.nombre}
      </p>

      <p className="mt-2">
        <b>Modelo:</b><br />
        {etiquetaSeleccionada.modelo}
      </p>

      <p className="mt-2 text-xs">
        IMEI:
        <br />
        {etiquetaSeleccionada.serie || "-"}
      </p>

      <div className="flex justify-center my-4">
        <QRCodeCanvas
          value={`https://TU-URL.vercel.app/consulta?telefono=${etiquetaSeleccionada.telefono}&orden=${etiquetaSeleccionada.numero}`}
          size={120}
        />
      </div>

      <button
        onClick={() => {

  const ventana = window.open("", "_blank");

  if (!ventana) return;

  ventana.document.write(`
    <html>
    <style>
@media print {
  button {
    display: none !important;
  }
}
</style>
      <body
        style="
          font-family: Arial;
          text-align:center;
          padding:20px;
        "
      >

        <h2>🛠️ Ink-Mobile</h2>

        <p>
          <b>Orden:</b><br/>
          ${etiquetaSeleccionada.numero}
        </p>

        <p>
          <b>Cliente:</b><br/>
          ${etiquetaSeleccionada.nombre}
        </p>

        <p>
          <b>Modelo:</b><br/>
          ${etiquetaSeleccionada.modelo}
        </p>

        <p>
          <b>IMEI:</b><br/>
          ${etiquetaSeleccionada.serie || "-"}
        </p>

        <br/>

        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https:/https://ink-mobile-app-kbu6-6ild063f1-inkmobilecruzverde-6483s-projects.vercel.app//consulta?telefono=${etiquetaSeleccionada.telefono}&orden=${etiquetaSeleccionada.numero}"
        />
<br/><br/>

<button
  onclick="window.location.href='/'"
  style="
    padding:12px 20px;
    font-size:18px;
    border:none;
    border-radius:10px;
    background:black;
    color:white;
  "
>
  ⬅ Volver
</button>
        <script>
          window.onload = () => {
            const button = document.getElementById("volverBtn");

if (button) {
  button.style.display = "none";
}

window.print();

if (button) {
  button.style.display = "block";
}
          };
        </script>

      </body>
    </html>
  `);

  ventana.document.close();

}}
        className="bg-black text-white px-4 py-2 rounded"
      >
        🖨️ Imprimir
      </button>

    </div>
  </div>
)}
  {/* MODAL PRO++ */}
  {ordenSeleccionada && (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity"
      onClick={() => setOrdenSeleccionada(null)}
    >
      <div
        className="bg-white p-6 rounded shadow w-full max-w-lg space-y-2 relative transform transition-all scale-100 opacity-100 max-h-[90vh] overflow-y-auto pb-24"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => setOrdenSeleccionada(null)} className="absolute top-2 right-2 text-xl">✖</button>

        <h2 className="text-xl font-bold">Orden {ordenSeleccionada.numero}</h2>
        {ordenSeleccionada && (
  <div className="bg-gray-100 p-3 rounded text-sm">
    <p className="font-bold mb-2">
      📋 Historial cliente
    </p>

    {ordenes
      .filter(
        (o) =>
          o.telefono === ordenSeleccionada.telefono &&
          o.id !== ordenSeleccionada.id
      )
      .slice(0, 5)
      .map((o) => (
        <div
          key={o.id}
          className="border-b py-1"
        >
          <p>
            <b>{o.modelo}</b>
          </p>

          <p className="text-gray-600">
            {o.problema}
          </p>

          <p className="text-xs">
            Estado: {o.estado}
          </p>
        </div>
      ))}

    {ordenes.filter(
      (o) =>
        o.telefono === ordenSeleccionada.telefono &&
        o.id !== ordenSeleccionada.id
    ).length === 0 && (
      <p className="text-gray-500">
        Sin historial
      </p>
    )}
  </div>
)}

        <input className="border p-2 w-full" value={ordenSeleccionada.nombre} onChange={(e) => setOrdenSeleccionada({ ...ordenSeleccionada, nombre: e.target.value })} />
        <input className="border p-2 w-full" value={ordenSeleccionada.telefono} onChange={(e) => setOrdenSeleccionada({ ...ordenSeleccionada, telefono: e.target.value })} />
        <input className="border p-2 w-full" value={ordenSeleccionada.dni || ""} onChange={(e) => setOrdenSeleccionada({ ...ordenSeleccionada, dni: e.target.value })} />
        <input className="border p-2 w-full" value={ordenSeleccionada.modelo} onChange={(e) => setOrdenSeleccionada({ ...ordenSeleccionada, modelo: e.target.value })} />
        <input className="border p-2 w-full"value={ordenSeleccionada.serie || ""}onChange={(e) =>setOrdenSeleccionada({...ordenSeleccionada,serie: e.target.value,})}/>
        <input className="border p-2 w-full" value={ordenSeleccionada.problema} onChange={(e) => setOrdenSeleccionada({ ...ordenSeleccionada, problema: e.target.value })} />
        <input className="border p-2 w-full" value={ordenSeleccionada.codigo || ""} onChange={(e) => setOrdenSeleccionada({ ...ordenSeleccionada, codigo: e.target.value })} />
        <input className="border p-2 w-full" value={ordenSeleccionada.presupuesto || ""} onChange={(e) => setOrdenSeleccionada({ ...ordenSeleccionada, presupuesto: e.target.value })} />
        <input className="border p-2 w-full" value={ordenSeleccionada.notas || ""} onChange={(e) => setOrdenSeleccionada({ ...ordenSeleccionada, notas: e.target.value })} />
        <select className="border p-2 w-full" value={ordenSeleccionada.estado} onChange={(e) => setOrdenSeleccionada({ ...ordenSeleccionada, estado: e.target.value })}>
          <select
  className="border p-2 w-full"
  value={form.tecnico || "Rubén"}
  onChange={(e) =>
    setForm({
      ...form,
      tecnico: e.target.value,
    })
  }
>

  <option>Rubén</option>
  <option>Alpha Electrónica</option>
  <option>Iván</option>

</select>
          {estados.map(e => <option key={e}>{e}</option>)}
        </select>
      {ordenSeleccionada.fechaEntrega && (
  <div className="bg-green-100 p-2 rounded text-sm">
    📦 Entregado el:
    <br />

    <b>
      {new Date(
        ordenSeleccionada.fechaEntrega
      ).toLocaleString()}
    </b>
  </div>
)}

<div className="border rounded p-2">
  <p className="text-sm mb-2 font-bold">Firma cliente</p>

    <SignatureCanvas
  ref={firmaRef}
  penColor="black"
  canvasProps={{
    width: 450,
    height: 150,
    className: "border w-full bg-white",
  }}
/>


  <button
    onClick={() => firmaRef.current?.clear()}
    className="bg-red-500 text-white px-3 py-1 rounded mt-2"
  >
    Limpiar firma
  </button>
</div>
        <div className="flex gap-3 pt-2">
          <button onClick={guardarEdicion} className="bg-blue-600 text-white px-4 py-2 rounded">💾 Guardar</button>
          <button
    onClick={() => compartirOrden(ordenSeleccionada)}
    className="bg-indigo-600 text-white px-4 py-2 rounded"
  >
    📤 Compartir
  </button>
          <button onClick={() => imprimirOrden(ordenSeleccionada)} className="bg-gray-700 text-white px-4 py-2 rounded">🧾 Imprimir</button>
        </div>

      </div>
    </div>
  )}

</div>
</>
);
}
