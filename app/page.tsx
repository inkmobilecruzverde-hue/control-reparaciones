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

/* ✅ TIPO PRO */
type Orden = {
  id: string;
  numero?: string;
  nombre: string;
  telefono: string;
  modelo: string;
  problema: string;
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
    modelo: "",
    problema: "",
    notas: "",
    presupuesto: "",
    estado: "RECIBIDO",
  });

  const generarNumero = () => {
    const año = new Date().getFullYear();
    const numero = ordenes.length + 1;
    return `${año}-${String(numero).padStart(4, "0")}`;
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
    if (!form.nombre) return;

    await addDoc(collection(db, "ordenes"), {
      ...form,
      numero: generarNumero(),
      fecha: new Date(),
    });

    setForm({
      nombre: "",
      telefono: "",
      modelo: "",
      problema: "",
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

    await updateDoc(
      doc(db, "ordenes", ordenSeleccionada.id),
      ordenSeleccionada
    );

    setOrdenSeleccionada(null);
    cargarOrdenes();
  };

  const imprimirOrden = (orden: Orden) => {
    const ventana = window.open("", "_blank");

    const fecha = new Date(
      orden.fecha?.seconds ? orden.fecha.seconds * 1000 : orden.fecha
    );

    ventana?.document.write(`
      <html>
        <head>
          <title>Orden ${orden.numero}</title>
          <style>
            body { font-family: Arial; padding: 20px; max-width: 400px; margin: auto; }
            h1 { text-align: center; font-size: 20px; }
            .linea { border-bottom: 1px dashed #000; margin: 10px 0; }
            .campo { margin: 5px 0; }
            .titulo { font-weight: bold; }
            .firma { margin-top: 40px; }
          </style>
        </head>
        <body>

          <h1>🛠️ TU TALLER</h1>

          <div class="linea"></div>

          <div class="campo"><b>Orden:</b> ${orden.numero}</div>
          <div class="campo"><b>Fecha:</b> ${fecha.toLocaleString()}</div>

          <div class="linea"></div>

          <div class="campo"><b>Cliente:</b> ${orden.nombre}</div>
          <div class="campo"><b>Teléfono:</b> ${orden.telefono}</div>

          <div class="linea"></div>

          <div class="campo"><b>Modelo:</b> ${orden.modelo}</div>
          <div class="campo"><b>Problema:</b> ${orden.problema}</div>

          <div class="linea"></div>

          <div class="campo"><b>Notas:</b> ${orden.notas || "-"}</div>
          <div class="campo"><b>Presupuesto:</b> ${orden.presupuesto || "-"} €</div>

          <div class="linea"></div>

          <div class="campo"><b>Estado:</b> ${orden.estado}</div>

          <div class="firma">
            Firma cliente: _______________________
          </div>

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

  /* 👁️ DETALLE */
  if (ordenSeleccionada) {
    const o = ordenSeleccionada;

    return (
      <div className="p-4 max-w-3xl mx-auto">
        <button
          onClick={() => setOrdenSeleccionada(null)}
          className="mb-4 bg-gray-300 px-3 py-1 rounded"
        >
          ⬅️ Volver
        </button>

        <div className="bg-white shadow p-6 rounded space-y-3">
          <h2 className="text-2xl font-bold">Orden {o.numero}</h2>

          <input className="border p-2 w-full" value={o.nombre} onChange={(e) => setOrdenSeleccionada({ ...o, nombre: e.target.value })} />
          <input className="border p-2 w-full" value={o.telefono} onChange={(e) => setOrdenSeleccionada({ ...o, telefono: e.target.value })} />
          <input className="border p-2 w-full" value={o.modelo} onChange={(e) => setOrdenSeleccionada({ ...o, modelo: e.target.value })} />
          <input className="border p-2 w-full" value={o.problema} onChange={(e) => setOrdenSeleccionada({ ...o, problema: e.target.value })} />
          <textarea className="border p-2 w-full" value={o.notas} onChange={(e) => setOrdenSeleccionada({ ...o, notas: e.target.value })} />
          <input className="border p-2 w-full" value={o.presupuesto} onChange={(e) => setOrdenSeleccionada({ ...o, presupuesto: e.target.value })} />

          <select
            className="border p-2 w-full"
            value={o.estado}
            onChange={(e) =>
              setOrdenSeleccionada({ ...o, estado: e.target.value })
            }
          >
            <option value="RECIBIDO">Recibido</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ESPERA">Espera</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>

          <div className="flex gap-2 flex-wrap">
            <button onClick={guardarEdicion} className="bg-blue-600 text-white px-4 py-2 rounded">
              💾 Guardar
            </button>

            <button onClick={() => enviarWhatsApp(o.telefono, o.nombre, o.estado)} className="bg-green-500 text-white px-4 py-2 rounded">
              📲 WhatsApp
            </button>

            <button onClick={() => imprimirOrden(o)} className="bg-gray-700 text-white px-4 py-2 rounded">
              🧾 Imprimir
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* 📋 LISTADO */
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">🛠️ Taller</h1>

      <input
        className="border p-2 w-full mb-4"
        placeholder="🔍 Buscar..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="bg-white p-4 rounded shadow mb-6 space-y-2">
        <input className="border p-2 w-full" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Modelo" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Problema" value={form.problema} onChange={(e) => setForm({ ...form, problema: e.target.value })} />
        <textarea className="border p-2 w-full" placeholder="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Presupuesto (€)" value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })} />

        <select className="border p-2 w-full" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
          <option value="RECIBIDO">Recibido</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="ESPERA">Espera</option>
          <option value="FINALIZADO">Finalizado</option>
        </select>

        <button onClick={crearOrden} className="bg-blue-600 text-white p-2 w-full">
          ➕ Crear orden
        </button>
      </div>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Nº</th>
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
              <td>{o.numero}</td>
              <td>{o.nombre}</td>
              <td>{o.modelo}</td>
              <td>{o.presupuesto} €</td>

              <td>
                <select value={o.estado} onChange={(e) => cambiarEstado(o.id, e.target.value)}>
                  <option value="RECIBIDO">Recibido</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ESPERA">Espera</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </td>

              <td className="space-x-2">
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