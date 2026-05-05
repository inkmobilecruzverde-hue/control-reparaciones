"use client";

import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

type Orden = {
  id: string;
  cliente: string;
  modelo: string;
  problema: string;
  estado: string;
  notas?: string;
  presupuesto?: string;
};

export default function Home() {
  const [cliente, setCliente] = useState("");
  const [modelo, setModelo] = useState("");
  const [problema, setProblema] = useState("");
  const [notas, setNotas] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [ordenes, setOrdenes] = useState<Orden[]>([]);

  // 🔥 Cargar órdenes
  const cargarOrdenes = async () => {
    const querySnapshot = await getDocs(collection(db, "ordenes"));

    const datos: Orden[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Orden, "id">),
    }));

    setOrdenes(datos);
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  // 🔥 Crear orden
  const crearOrden = async () => {
    if (!cliente || !modelo || !problema) return;

    await addDoc(collection(db, "ordenes"), {
      cliente,
      modelo,
      problema,
      estado: "RECIBIDO",
      notas,
      presupuesto,
    });

    setCliente("");
    setModelo("");
    setProblema("");
    setNotas("");
    setPresupuesto("");

    cargarOrdenes();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Control de Reparaciones</h1>

      <input
        placeholder="Nombre cliente"
        value={cliente}
        onChange={(e) => setCliente(e.target.value)}
      />
      <br />

      <input
        placeholder="Modelo"
        value={modelo}
        onChange={(e) => setModelo(e.target.value)}
      />
      <br />

      <input
        placeholder="Problema"
        value={problema}
        onChange={(e) => setProblema(e.target.value)}
      />
      <br />

      <input
        placeholder="Notas"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
      />
      <br />

      <input
        placeholder="Presupuesto"
        value={presupuesto}
        onChange={(e) => setPresupuesto(e.target.value)}
      />
      <br />

      <button onClick={crearOrden}>Crear orden</button>

      <hr />

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Nº</th>
            <th>Cliente</th>
            <th>Modelo</th>
            <th>Estado</th>
            <th>Notas</th>
            <th>Presupuesto</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((o, i) => (
            <tr key={o.id}>
              <td>{i + 1}</td>
              <td>{o.cliente}</td>
              <td>{o.modelo}</td>
              <td>{o.estado}</td>
              <td>{o.notas}</td>
              <td>{o.presupuesto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}