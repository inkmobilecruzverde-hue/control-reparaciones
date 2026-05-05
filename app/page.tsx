"use client";

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

/* ✅ TIPO */
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

  // 🔥 Número único
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
    if (!form.nombre || !form.telefono) {
      alert("Faltan datos");
      return;
    }

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
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`);
    }
  };

  const guardarEdicion = async () => {
    if (!ordenSeleccionada) return;

    const { id, ...datos } = ordenSeleccionada;
    await updateDoc(doc(db, "ordenes", id), datos as any);

    setOrdenSeleccionada(null);
    cargarOrdenes();
  };

  // 🧾 IMPRIMIR
  const imprimirOrden = (orden: Orden) => {
    if (typeof window === "undefined") return;

    const ventana = window.open("", "_blank");
    const fecha = new Date(orden.fecha);

    ventana?.document.write(`
      <html>
        <body style="font-family:Arial;padding:20px;max-width:400px;margin:auto">
          <h2 style="text-align:center">🛠️ Ink-Mobile</h2>

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

  const filtradas = ordenes.filter(
    (o) =>
      o.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.modelo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // 👁️ DETALLE
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

        <button onClick={guardarEdicion}className="bg-blue-600 text-white px-4 py-2 rounded">💾 Guardar</button>
        <button onClick={() => imprimirOrden(o)}className="bg-gray-700 text-white px-4 py-2 rounded">🧾 Imprimir</button>
      </div>
    );
  }

  // 📋 LISTADO
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">🛠️ Ink-Mobile</h1>

      <input
        className="border p-2 w-full mb-4"
        placeholder="Buscar..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {/* FORM */}
      <div className="bg-white p-4 rounded shadow mb-6 space-y-2">
        <input className="border p-2 w-full" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        <input className="border p-2 w-full" placeholder="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Modelo" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Problema" value={form.problema} onChange={(e) => setForm({ ...form, problema: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Código desbloqueo" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
        <textarea className="border p-2 w-full" placeholder="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Presupuesto (€)" value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })} />

        <button onClick={crearOrden} className="bg-blue-600 text-white p-2 w-full">
          ➕ Crear orden
        </button>
      </div>

      {/* TABLA */}
      <table className="w-full border">
        <tbody>
          {filtradas.map((o) => (
            <tr key={o.id}>
              <td>{o.nombre}</td>
              <td>{o.modelo}</td>
              <td>
                <button onClick={() => setOrdenSeleccionada(o)}>👁️</button>
                <button onClick={() => enviarWhatsApp(o.telefono, o.nombre, o.estado)}>📲</button>
                <button onClick={() => eliminarOrden(o.id)}>❌</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}