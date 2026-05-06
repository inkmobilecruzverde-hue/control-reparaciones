"use client";

import SignatureCanvas from "react-signature-canvas";
import { useRef } from "react";
import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
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
estado: string;
fecha?: any;
firma?: string | null;
};

export default function Home() {
const [ordenes, setOrdenes] = useState<Orden[]>([]);
const [busqueda, setBusqueda] = useState("");
const [filtroEstado, setFiltroEstado] = useState("TODOS");
const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null);

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
estado: "RECIBIDO",
});
const firmaRef = useRef<any>(null);
const estados = ["RECIBIDO", "PENDIENTE", "ESPERA", "FINALIZADO"];
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
const snapshot = await getDocs(collection(db, "ordenes"));
const datos: Orden[] = snapshot.docs.map((docu) => ({
id: docu.id,
...(docu.data() as Omit<Orden, "id">),
}));
setOrdenes(datos);
};

useEffect(() => {
cargarOrdenes();
}, []);

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
  estado: "RECIBIDO",
});

cargarOrdenes();


};

const cambiarEstado = async (id: string, estado: string) => {
await updateDoc(doc(db, "ordenes", id), { estado });
cargarOrdenes();
};

const eliminarOrden = async (id: string) => {
if (!confirm("¿Eliminar orden?")) return;
await deleteDoc(doc(db, "ordenes", id));
cargarOrdenes();
};

const enviarWhatsApp = (telefono: string, nombre: string, estado: string) => {
const msg = `Hola ${nombre}, tu equipo está en estado: ${estado}`;
window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`);
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

const imprimirOrden = (orden: Orden) => {
const ventana = window.open("", "_blank");
const fecha = new Date(orden.fecha);


ventana?.document.write(`
  <html>
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



      <script>window.print()</script>
    </body>
  </html>
`);

ventana?.document.close();


};

const total = ordenes.length;
const recibidos = ordenes.filter(o => o.estado === "RECIBIDO").length;
const pendientes = ordenes.filter(o => o.estado === "PENDIENTE").length;
const espera = ordenes.filter(o => o.estado === "ESPERA").length;
const finalizadas = ordenes.filter(o => o.estado === "FINALIZADO").length;

const ingresos = ordenes
.filter(o => o.estado === "FINALIZADO")
.reduce((acc, o) => acc + Number(o.presupuesto || 0), 0);

const filtradas = ordenes.filter((o) => {
const coincideBusqueda =
o.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
o.modelo?.toLowerCase().includes(busqueda.toLowerCase());


const coincideEstado =
  filtroEstado === "TODOS" || o.estado === filtroEstado;

return coincideBusqueda && coincideEstado;


});

return ( <div className="p-4 max-w-7xl mx-auto">


  <h1 className="text-3xl font-bold mb-4">🛠️ Ink-Mobile</h1>

  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
    <div className="bg-blue-100 p-3 rounded text-center">Recibidos: {recibidos}</div>
    <div className="bg-yellow-100 p-3 rounded text-center">Pendientes: {pendientes}</div>
    <div className="bg-orange-100 p-3 rounded text-center">Espera: {espera}</div>
    <div className="bg-green-100 p-3 rounded text-center">Finalizadas: {finalizadas}</div>
    <div className="bg-gray-200 p-3 rounded text-center">Total: {total}</div>
    <div className="bg-emerald-200 p-3 rounded text-center">€ {ingresos}</div>
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
    <input className="border p-2 w-full" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
    <input className="border p-2 w-full" placeholder="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
    <input className="border p-2 w-full" placeholder="Modelo" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
    <input className="border p-2 w-full" placeholder="Nº Serie"value={form.serie || ""}onChange={(e) => setForm({ ...form, serie: e.target.value })}/>
    <input className="border p-2 w-full" placeholder="Problema" value={form.problema} onChange={(e) => setForm({ ...form, problema: e.target.value })} />
    <input className="border p-2 w-full" placeholder="Código desbloqueo" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
    <input className="border p-2 w-full" placeholder="Notas " value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
    <input className="border p-2 w-full" placeholder="Presupuesto (€)" value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })} />

    <select className="border p-2 w-full" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
      {estados.map(e => <option key={e}>{e}</option>)}
    </select>

    <button onClick={crearOrden} className="bg-blue-600 text-white p-2 w-full">➕ Crear orden</button>
  </div>

  <table className="w-full border">
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
      {filtradas.map((o) => (
        <tr key={o.id} className="border">
          <td>{o.nombre}</td>
          <td>{o.modelo}</td>
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
            <button onClick={() => enviarWhatsApp(o.telefono, o.nombre, o.estado)}>📲</button>
            <button onClick={() => imprimirOrden(o)}>🧾</button>
            <button onClick={() => eliminarOrden(o.id)}>❌</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* MODAL PRO++ */}
  {ordenSeleccionada && (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity"
      onClick={() => setOrdenSeleccionada(null)}
    >
      <div
        className="bg-white p-6 rounded shadow w-full max-w-lg space-y-2 relative transform transition-all scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => setOrdenSeleccionada(null)} className="absolute top-2 right-2 text-xl">✖</button>

        <h2 className="text-xl font-bold">Orden {ordenSeleccionada.numero}</h2>

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
          {estados.map(e => <option key={e}>{e}</option>)}
        </select>

<div className="border rounded p-2">
  <p className="text-sm mb-2 font-bold">Firma cliente</p>
{mounted && (
  <div ref={(el) => {
    if (el && !firmaRef.current) {
      firmaRef.current = el;
    }
  }}>
    <SignatureCanvas
      penColor="black"
      canvasProps={{
        width: 450,
        height: 150,
        className: "border w-full bg-white",
      }}
    />
  </div>
)}

  <button
    onClick={() => firmaRef.current?.clear()}
    className="bg-red-500 text-white px-3 py-1 rounded mt-2"
  >
    Limpiar firma
  </button>
</div>
        <div className="flex gap-3 pt-2">
          <button onClick={guardarEdicion} className="bg-blue-600 text-white px-4 py-2 rounded">💾 Guardar</button>
          <button onClick={() => imprimirOrden(ordenSeleccionada)} className="bg-gray-700 text-white px-4 py-2 rounded">🧾 Imprimir</button>
        </div>

      </div>
    </div>
  )}

</div>


);
}
