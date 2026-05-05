"use client";

import { auth } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
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
  problema: string;
  codigo?: string;
  notas?: string;
  presupuesto?: string;
  estado: string;
  fecha?: any;
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
    problema: "",
    codigo: "",
    notas: "",
    presupuesto: "",
    estado: "RECIBIDO",
  });

  const estados = ["RECIBIDO", "PENDIENTE", "ESPERA", "FINALIZADO"];

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
    const { id, ...datos } = ordenSeleccionada;
    await updateDoc(doc(db, "ordenes", id), datos as any);
    setOrdenSeleccionada(null);
    cargarOrdenes();
  };

  const imprimirOrden = (orden: Orden) => {
    const ventana = window.open("", "_blank");
    const fecha = new Date(orden.fecha);

    ventana?.document.write(`
      <html>
        <body style="font-family:Arial;padding:20px;max-width:400px;margin:auto">
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
          <p><b>Código:</b> ${orden.codigo || "-"}</p>

          <hr/>

          <p><b>Notas:</b> ${orden.notas || "-"}</p>
          <p><b>Presupuesto:</b> ${orden.presupuesto || "-"} €</p>

          <hr/>

          <p><b>Estado:</b> ${orden.estado}</p>

          <br/><br/>
          Firma: ___________________

          <script>window.print()</script>
        </body>
      </html>
    `);

    ventana?.document.close();
  };

  const colorEstado = (estado: string) => {
    switch (estado) {
      case "RECIBIDO": return "bg-blue-500";
      case "PENDIENTE": return "bg-yellow-500";
      case "ESPERA": return "bg-orange-500";
      case "FINALIZADO": return "bg-green-600";
      default: return "bg-gray-400";
    }
  };

  const total = ordenes.length;
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

  if (ordenSeleccionada) {
    const o = ordenSeleccionada;

    return (
      <div className="p-4 max-w-3xl mx-auto">
        <button onClick={() => setOrdenSeleccionada(null)}>⬅️ Volver</button>

        <input value={o.nombre} onChange={(e) => setOrdenSeleccionada({ ...o, nombre: e.target.value })} />
        <input value={o.telefono} onChange={(e) => setOrdenSeleccionada({ ...o, telefono: e.target.value })} />
        <input value={o.dni || ""} onChange={(e) => setOrdenSeleccionada({ ...o, dni: e.target.value })} />
        <input value={o.modelo} onChange={(e) => setOrdenSeleccionada({ ...o, modelo: e.target.value })} />
        <input value={o.problema} onChange={(e) => setOrdenSeleccionada({ ...o, problema: e.target.value })} />
        <input value={o.codigo || ""} onChange={(e) => setOrdenSeleccionada({ ...o, codigo: e.target.value })} />
        <input value={o.presupuesto || ""} onChange={(e) => setOrdenSeleccionada({ ...o, presupuesto: e.target.value })} />

        <div className="flex gap-3 mt-4">
          <button onClick={guardarEdicion} className="bg-blue-600 text-white px-4 py-2 rounded">💾 Guardar</button>
          <button onClick={() => imprimirOrden(o)} className="bg-gray-700 text-white px-4 py-2 rounded">🧾 Imprimir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">

      <h1 className="text-3xl font-bold mb-4">🛠️ Ink-Mobile</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-gray-200 p-3 rounded">Total: {total}</div>
        <div className="bg-yellow-200 p-3 rounded">Pendientes: {pendientes}</div>
        <div className="bg-orange-200 p-3 rounded">Espera: {espera}</div>
        <div className="bg-green-200 p-3 rounded">Finalizadas: {finalizadas}</div>
        <div className="bg-blue-200 p-3 rounded">€ {ingresos}</div>
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
        <input className="border p-2 w-full" placeholder="Problema" value={form.problema} onChange={(e) => setForm({ ...form, problema: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Código desbloqueo" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
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
                  className={`text-white px-2 py-1 rounded ${colorEstado(o.estado)}`}
                >
                  {estados.map((e) => (
                    <option key={e} className="text-black">{e}</option>
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

    </div>
  );
}