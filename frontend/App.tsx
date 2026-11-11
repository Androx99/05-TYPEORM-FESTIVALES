import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

type FestivalInfo = {
  id: number;
  nombre: string;
};

type Actuacion = {
  id: number;
  nombre: string;
  duracionMinutos: number;
  festival: FestivalInfo;
};

type FestivalCard = {
  id: number;
  nombre: string;
  actuaciones: Actuacion[];
};

export default function App() {
  const [festivales, setFestivales] = useState<FestivalCard[]>([]);
  const [listaFestivales, setListaFestivales] = useState<FestivalInfo[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Filtro / Búsqueda (Punto 6)
  const [busqueda, setBusqueda] = useState("");

  // Estado del Modal para Crear / Editar (Puntos 1, 4 y 5)
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null); // null = nuevo registro
  const [formNombre, setFormNombre] = useState("");
  const [formDuracion, setFormDuracion] = useState("");
  const [formFestivalId, setFormFestivalId] = useState<number>(1);

  // Cargar lista de actuaciones y festivales
  async function cargarDatos(textoFiltro = busqueda) {
    setLoading(true);
    setError("");
    try {
      // 1. Cargar festivales para el selector de clave foránea
      try {
        const festRes = await fetch(`${API_URL}/actuaciones/festivales`);
        if (festRes.ok) {
          const festJson: FestivalInfo[] = await festRes.json();
          setListaFestivales(festJson);
          if (festJson.length > 0 && !formFestivalId) {
            setFormFestivalId(festJson[0].id);
          }
        }
      } catch {
        // En caso de que no responda festivales, no interrumpe el flujo
      }

      // 2. Cargar actuaciones (con o sin búsqueda mediante WHERE - Punto 6)
      const url = textoFiltro.trim()
        ? `${API_URL}/actuaciones/buscar?texto=${encodeURIComponent(textoFiltro.trim())}`
        : `${API_URL}/actuaciones`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const actuaciones: Actuacion[] = await response.json();

      // Agrupar actuaciones por festival (Punto 2: Listar)
      const mapa = new Map<number, FestivalCard>();
      for (const act of actuaciones) {
        const fId = act.festival.id;
        if (!mapa.has(fId)) {
          mapa.set(fId, { id: fId, nombre: act.festival.nombre, actuaciones: [] });
        }
        mapa.get(fId)!.actuaciones.push(act);
      }
      setFestivales(Array.from(mapa.values()));
    } catch {
      setError("No se pudo conectar con la API. Comprueba NestJS y PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void cargarDatos();
  }, []);

  // 1. Abrir modal para Crear
  function abrirCrear() {
    setEditandoId(null);
    setFormNombre("");
    setFormDuracion("");
    setFormFestivalId(listaFestivales[0]?.id || 1);
    setModalVisible(true);
  }

  // 4 y 5. Abrir modal para Editar
  function abrirEditar(act: Actuacion) {
    setEditandoId(act.id);
    setFormNombre(act.nombre);
    setFormDuracion(String(act.duracionMinutos));
    setFormFestivalId(act.festival.id);
    setModalVisible(true);
  }

  // Guardar (Crear o Editar)
  async function guardarRegistro() {
    if (!formNombre.trim()) {
      alert("El nombre de la actuación es obligatorio");
      return;
    }
    const duracion = parseInt(formDuracion, 10);
    if (isNaN(duracion) || duracion <= 0) {
      alert("La duración debe ser un número mayor a 0");
      return;
    }

    try {
      if (editandoId === null) {
        // 1. POST - Añadir un registro con clave foránea
        const res = await fetch(`${API_URL}/actuaciones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formNombre.trim(),
            duracionMinutos: duracion,
            idFestival: formFestivalId,
          }),
        });
        if (!res.ok) throw new Error(`Error al crear: HTTP ${res.status}`);
      } else {
        // 4 y 5. PATCH - Modificar campo conservando ID y reasignar clave foránea
        const res = await fetch(`${API_URL}/actuaciones/${editandoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formNombre.trim(),
            duracionMinutos: duracion,
            idFestival: formFestivalId,
          }),
        });
        if (!res.ok) throw new Error(`Error al actualizar: HTTP ${res.status}`);
      }

      setModalVisible(false);
      await cargarDatos();
    } catch (e: any) {
      alert(e.message || "Error al guardar");
    }
  }

  // 3. Eliminar registro elegido
  async function eliminarRegistro(id: number, nombre: string) {
    const confirmar = window.confirm
      ? window.confirm(`¿Seguro que deseas eliminar la actuación "${nombre}"?`)
      : true;

    if (!confirmar) return;

    try {
      const res = await fetch(`${API_URL}/actuaciones/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Error al eliminar: HTTP ${res.status}`);
      await cargarDatos();
    } catch (e: any) {
      alert(e.message || "Error al eliminar");
    }
  }

  // 6. Ejecutar búsqueda con WHERE
  function handleBuscar() {
    void cargarDatos(busqueda);
  }

  function handleLimpiarBusqueda() {
    setBusqueda("");
    void cargarDatos("");
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Barra superior de acciones */}
        <View style={styles.topBar}>
          <Pressable style={styles.btnPrimary} onPress={abrirCrear}>
            <Text style={styles.btnPrimaryText}>+ Nueva Actuación</Text>
          </Pressable>

          {/* Buscador WHERE (Punto 6) */}
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre..."
              placeholderTextColor="#7a9286"
              value={busqueda}
              onChangeText={setBusqueda}
              onSubmitEditing={handleBuscar}
            />
            <Pressable style={styles.btnSearch} onPress={handleBuscar}>
              <Text style={styles.btnSearchText}>Buscar</Text>
            </Pressable>
            {busqueda.length > 0 && (
              <Pressable style={styles.btnClear} onPress={handleLimpiarBusqueda}>
                <Text style={styles.btnClearText}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {loading && <Text style={styles.status}>Cargando actuaciones…</Text>}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Tarjetas por Festival */}
        {festivales.length === 0 && !loading && !error && (
          <View style={styles.cardEmpty}>
            <Text style={styles.emptyText}>No se encontraron actuaciones.</Text>
          </View>
        )}

        {festivales.map((festival) => (
          <View key={festival.id} style={styles.card}>
            {/* Etiqueta del festival */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{festival.nombre}</Text>
            </View>

            {/* Título */}
            <Text style={styles.title}>Actuaciones</Text>

            {/* Lista de actuaciones con botones de Editar y Eliminar */}
            <View style={styles.list}>
              {festival.actuaciones.map((act) => (
                <View key={act.id} style={styles.row}>
                  <Text style={styles.rowText}>
                    {act.nombre} · {act.duracionMinutos} min
                  </Text>

                  {/* Acciones por cada registro (Puntos 3, 4 y 5) */}
                  <View style={styles.rowActions}>
                    <Pressable
                      style={styles.btnEdit}
                      onPress={() => abrirEditar(act)}
                      accessibilityLabel="Editar actuación"
                    >
                      <Text style={styles.btnEditText}>Editar</Text>
                    </Pressable>

                    <Pressable
                      style={styles.btnDelete}
                      onPress={() => eliminarRegistro(act.id, act.nombre)}
                      accessibilityLabel="Eliminar actuación"
                    >
                      <Text style={styles.btnDeleteText}>Eliminar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal para Crear y Editar (Puntos 1, 4 y 5) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editandoId === null ? "Añadir Nueva Actuación" : "Editar Actuación"}
            </Text>

            {/* Campo 1: Nombre */}
            <Text style={styles.label}>Nombre de la actuación:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Solo de guitarra"
              placeholderTextColor="#95a59c"
              value={formNombre}
              onChangeText={setFormNombre}
            />

            {/* Campo 2: Duración */}
            <Text style={styles.label}>Duración (minutos):</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 45"
              placeholderTextColor="#95a59c"
              keyboardType="numeric"
              value={formDuracion}
              onChangeText={setFormDuracion}
            />

            {/* Campo 3: Clave Foránea / Asociación Festival (Punto 5) */}
            <Text style={styles.label}>Festival (Clave foránea):</Text>
            <View style={styles.festivalSelector}>
              {(listaFestivales.length > 0
                ? listaFestivales
                : festivales.map((f) => ({ id: f.id, nombre: f.nombre }))
              ).map((f) => {
                const selected = formFestivalId === f.id;
                return (
                  <Pressable
                    key={f.id}
                    style={[styles.festivalOption, selected && styles.festivalOptionSelected]}
                    onPress={() => setFormFestivalId(f.id)}
                  >
                    <Text
                      style={[
                        styles.festivalOptionText,
                        selected && styles.festivalOptionTextSelected,
                      ]}
                    >
                      {f.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Botones del Modal */}
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.btnCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </Pressable>

              <Pressable style={styles.btnSave} onPress={guardarRegistro}>
                <Text style={styles.btnSaveText}>
                  {editandoId === null ? "Crear" : "Guardar Cambios"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f5ed" },
  scroll: { padding: 24, gap: 16 },
  status: { color: "#52675d", textAlign: "center", marginVertical: 8 },
  error: { color: "#a13030", textAlign: "center", marginVertical: 8 },

  // Barra de búsqueda y botón añadir
  topBar: {
    maxWidth: 620,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  btnPrimary: {
    backgroundColor: "#204e43",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnPrimaryText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd8cb",
    paddingHorizontal: 8,
    flex: 1,
    minWidth: 220,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    color: "#183a32",
    fontSize: 14,
    outlineStyle: "none" as any,
  },
  btnSearch: {
    backgroundColor: "#e9efe5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnSearchText: { color: "#204e43", fontWeight: "700", fontSize: 12 },
  btnClear: { paddingHorizontal: 6 },
  btnClearText: { color: "#7a9286", fontSize: 14, fontWeight: "700" },

  // Tarjeta de festival
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    maxWidth: 620,
    width: "100%",
    alignSelf: "center",
    shadowColor: "#183a32",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardEmpty: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    maxWidth: 620,
    width: "100%",
    alignSelf: "center",
  },
  emptyText: { color: "#60756a", textAlign: "center", fontSize: 15 },

  // Badge del festival
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e9efe5",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  badgeText: { color: "#204e43", fontSize: 13, fontWeight: "700" },

  // Título
  title: { color: "#183a32", fontSize: 22, fontWeight: "800", marginBottom: 12 },

  // Filas de actuación
  list: { gap: 0 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#e3e9e1",
    gap: 8,
  },
  rowText: { color: "#183a32", fontSize: 15, flex: 1 },
  rowActions: {
    flexDirection: "row",
    gap: 8,
  },
  btnEdit: {
    backgroundColor: "#eaf1ed",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnEditText: { color: "#204e43", fontWeight: "700", fontSize: 12 },
  btnDelete: {
    backgroundColor: "#fbebee",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnDeleteText: { color: "#b3261e", fontWeight: "700", fontSize: 12 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 480,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#183a32",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#47705f",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd8cb",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: "#183a32",
    outlineStyle: "none" as any,
  },
  festivalSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  festivalOption: {
    borderWidth: 1,
    borderColor: "#cbd8cb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f7f8f4",
  },
  festivalOptionSelected: {
    backgroundColor: "#204e43",
    borderColor: "#204e43",
  },
  festivalOptionText: {
    color: "#486457",
    fontWeight: "600",
    fontSize: 13,
  },
  festivalOptionTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  btnCancel: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#f0f2ed",
  },
  btnCancelText: { color: "#52675d", fontWeight: "700", fontSize: 14 },
  btnSave: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#204e43",
  },
  btnSaveText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },
});
