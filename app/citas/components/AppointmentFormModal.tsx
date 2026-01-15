"use client";

import { useState, FormEvent, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { getUserIdFromToken } from "@/src/lib/auth";
import type { AppointmentCreateRequest } from "@/src/lib/types/appointment";
import type { Branch } from "@/src/lib/types/branch";
import type { Client } from "@/src/lib/types/client";
import type { Vehicle } from "@/src/lib/types/vehicle";

type AppointmentFormModalProps = {
  isOpen: boolean;
  branches: Branch[];
  clients: Client[];
  vehicles: Vehicle[];
  onClose: () => void;
  onSubmit: (data: AppointmentCreateRequest) => Promise<void>;
  loading?: boolean;
};

type FormData = {
  // Paso 1: Sucursal, Fecha y Hora
  branch_id: string;
  appointment_date: string;
  selected_time: string;

  // Paso 2: Cliente, Vehículo, Proyecto y Tipo de Reparación
  client_id: string;
  vehicle_id: string;
  project_name: string;
  appointment_type: string;

  // Paso 3: Asesor, Conductor y Dirección
  advisor_id: string;
  driver_name: string;
  pickup_address: string;

  // Paso 4: Datos de Contacto
  contact_name: string;
  contact_phone: string;
  contact_email: string;

  // Campos adicionales
  notes: string;
};

const REPAIR_TYPES = [
  "Mantenimiento Preventivo",
  "Mantenimiento Correctivo",
  "Diagnóstico",
  "Reparación de Motor",
  "Reparación de Transmisión",
  "Sistema de Frenos",
  "Sistema Eléctrico",
  "Suspensión",
  "Afinación",
  "Cambio de Aceite",
];

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export default function AppointmentFormModal({
  isOpen,
  branches,
  clients,
  vehicles,
  onClose,
  onSubmit,
  loading = false,
}: AppointmentFormModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    branch_id: "",
    appointment_date: "",
    selected_time: "",
    client_id: "",
    vehicle_id: "",
    project_name: "",
    appointment_type: "",
    advisor_id: "",
    driver_name: "",
    pickup_address: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  
  // Estado para rastrear qué pasos han sido validados
  const [validatedSteps, setValidatedSteps] = useState<Set<number>>(new Set());

  // Estado para el calendario
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData({
        branch_id: "",
        appointment_date: "",
        selected_time: "",
        client_id: "",
        vehicle_id: "",
        project_name: "",
        appointment_type: "",
        advisor_id: "",
        driver_name: "",
        pickup_address: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        notes: "",
      });
      setErrors({});
      setValidatedSteps(new Set());
      setCalendarDate(new Date());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Si cambia el cliente, limpiar el vehículo seleccionado
    if (name === "client_id") {
      setFormData((prev) => ({
        ...prev,
        vehicle_id: "",
      }));
    }
  };

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      selected_time: time,
    }));
    if (errors.selected_time) {
      setErrors((prev) => ({ ...prev, selected_time: undefined }));
    }
  };

  const handleRepairTypeToggle = (type: string) => {
    setFormData((prev) => {
      // Dividir los tipos actuales por coma
      const currentTypes = prev.appointment_type
        ? prev.appointment_type
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      // Si el tipo ya está seleccionado, removerlo; si no, agregarlo
      const isSelected = currentTypes.includes(type);
      const newTypes = isSelected
        ? currentTypes.filter((t) => t !== type)
        : [...currentTypes, type];

      // Concatenar con comas
      return {
        ...prev,
        appointment_type: newTypes.join(", "),
      };
    });
    if (errors.appointment_type) {
      setErrors((prev) => ({ ...prev, appointment_type: undefined }));
    }
  };

  // Validar paso actual
  const validateStep = (step: number, showErrors: boolean = true): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!formData.branch_id.trim()) {
        newErrors.branch_id = "La sucursal es requerida";
      }
      if (!formData.appointment_date.trim()) {
        newErrors.appointment_date = "La fecha es requerida";
      }
      if (!formData.selected_time.trim()) {
        newErrors.selected_time = "La hora es requerida";
      }
    } else if (step === 2) {
      if (!formData.client_id.trim()) {
        newErrors.client_id = "El cliente es requerido";
      }
      if (!formData.vehicle_id.trim()) {
        newErrors.vehicle_id = "El vehículo es requerido";
      }
      if (!formData.project_name.trim()) {
        newErrors.project_name = "El proyecto es requerido";
      }
      if (!formData.appointment_type.trim()) {
        newErrors.appointment_type = "El tipo de reparación es requerido";
      }
    } else if (step === 3) {
      if (!formData.advisor_id.trim()) {
        newErrors.advisor_id = "El asesor es requerido";
      }
      if (!formData.driver_name.trim()) {
        newErrors.driver_name = "El nombre del conductor es requerido";
      }
      if (!formData.pickup_address.trim()) {
        newErrors.pickup_address = "La dirección de recolección es requerida";
      }
    } else if (step === 4) {
      if (!formData.contact_name.trim()) {
        newErrors.contact_name = "El nombre de contacto es requerido";
      }
      if (!formData.contact_phone.trim()) {
        newErrors.contact_phone = "El teléfono de contacto es requerido";
      }
      if (!formData.contact_email.trim()) {
        newErrors.contact_email = "El email de contacto es requerido";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.contact_email.trim())) {
          newErrors.contact_email =
            "Por favor, ingresa un correo electrónico válido";
        }
      }
    }

    // Solo establecer errores si showErrors es true (cuando se intenta avanzar/enviar)
    // o si el paso ya ha sido validado antes (para mantener errores visibles después de la primera validación)
    if (showErrors || validatedSteps.has(step)) {
      // Crear nuevo objeto de errores manteniendo solo los errores del paso actual y otros pasos ya validados
      const currentErrors: Partial<Record<keyof FormData, string>> = {};
      
      // Mantener errores de otros pasos que ya fueron validados
      validatedSteps.forEach((validatedStep) => {
        if (validatedStep !== step) {
          // Mantener errores de otros pasos validados
          if (validatedStep === 1) {
            if (errors.branch_id) currentErrors.branch_id = errors.branch_id;
            if (errors.appointment_date) currentErrors.appointment_date = errors.appointment_date;
            if (errors.selected_time) currentErrors.selected_time = errors.selected_time;
          } else if (validatedStep === 2) {
            if (errors.client_id) currentErrors.client_id = errors.client_id;
            if (errors.vehicle_id) currentErrors.vehicle_id = errors.vehicle_id;
            if (errors.project_name) currentErrors.project_name = errors.project_name;
            if (errors.appointment_type) currentErrors.appointment_type = errors.appointment_type;
          } else if (validatedStep === 3) {
            if (errors.advisor_id) currentErrors.advisor_id = errors.advisor_id;
            if (errors.driver_name) currentErrors.driver_name = errors.driver_name;
            if (errors.pickup_address) currentErrors.pickup_address = errors.pickup_address;
          } else if (validatedStep === 4) {
            if (errors.contact_name) currentErrors.contact_name = errors.contact_name;
            if (errors.contact_phone) currentErrors.contact_phone = errors.contact_phone;
            if (errors.contact_email) currentErrors.contact_email = errors.contact_email;
          }
        }
      });
      
      // Agregar errores del paso actual
      Object.assign(currentErrors, newErrors);
      
      setErrors(currentErrors);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Marcar el paso actual como validado antes de validar
    setValidatedSteps((prev) => new Set(prev).add(currentStep));
    // Validar con showErrors = true para mostrar errores si los hay
    if (validateStep(currentStep, true)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Marcar el paso 4 como validado antes de validar
    setValidatedSteps((prev) => new Set(prev).add(4));
    // Validar con showErrors = true para mostrar errores si los hay
    if (!validateStep(4, true)) {
      return;
    }

    try {
      // Construir fecha y hora completa
      const [hours, minutes] = formData.selected_time.split(":");
      const appointmentDateTime = new Date(formData.appointment_date);
      appointmentDateTime.setHours(
        parseInt(hours, 10),
        parseInt(minutes, 10),
        0,
        0
      );

      const endDateTime = new Date(appointmentDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1); // Duración estimada de 1 hora

      // Obtener user_id del token JWT
      const userId = getUserIdFromToken() || "1"; // Fallback a "1" si no se puede obtener del token

      // Usar directamente los IDs del formData ya que ahora guardamos el _id cuando está disponible
      // Si el formData tiene un ID normalizado, intentar encontrar el _id original
      const selectedClient = clients.find(
        (c) => c._id === formData.client_id || c.id === formData.client_id
      );
      const selectedVehicle = vehicles.find(
        (v) => v._id === formData.vehicle_id || v.id === formData.vehicle_id
      );
      const selectedBranch = branches.find((b) => {
        const branchWithId = b as Branch & { _id?: string };
        return (
          branchWithId._id === formData.branch_id || b.id === formData.branch_id
        );
      });

      // Preferir _id si existe, sino usar el id normalizado o el formData directamente
      const clientId = selectedClient?._id || formData.client_id;
      const vehicleId = selectedVehicle?._id || formData.vehicle_id;
      const branchId =
        (selectedBranch as Branch & { _id?: string })?._id ||
        formData.branch_id;

      // Validar que todos los IDs sean válidos
      if (!clientId || !vehicleId || !branchId) {
        throw new Error(
          "Error: Uno o más IDs no son válidos. Por favor, selecciona todos los campos requeridos."
        );
      }

      // Procesar tipos de reparación concatenados
      // Dividir por comas, convertir a lowercase y reemplazar espacios con guiones bajos
      const repairTypes = formData.appointment_type
        .split(",")
        .map((type) => type.trim().toLowerCase().replace(/\s+/g, "_"))
        .filter(Boolean)
        .join(", "); // Volver a concatenar con comas

      const submitData: AppointmentCreateRequest = {
        appointment_date: appointmentDateTime.toISOString(),
        client_id: clientId,
        vehicle_id: vehicleId,
        appointment_type: repairTypes,
        notes:
          formData.notes ||
          `Proyecto: ${formData.project_name}. Conductor: ${formData.driver_name}. Dirección: ${formData.pickup_address}`,
        branch_id: branchId,
        user_id: userId,
        created_by: userId,
        assigned_to: userId,
        advisor_id: formData.advisor_id || userId, // Si no hay advisor_id, usar el userId como fallback
        start_time: appointmentDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        estimated_duration: 60,
        status: "programado",
      };

      console.log(
        "Datos a enviar al crear cita:",
        JSON.stringify(submitData, null, 2)
      );
      await onSubmit(submitData);
      setErrors({});
    } catch (error) {
      console.error("Error en handleSubmit del modal:", error);
      // No re-lanzar el error aquí, ya que el componente padre lo maneja
      // Pero sí podemos agregar más información de debug
      if (error && typeof error === "object") {
        console.error("Detalles del error:", JSON.stringify(error, null, 2));
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCurrentStep(1);
      setFormData({
        branch_id: "",
        appointment_date: "",
        selected_time: "",
        client_id: "",
        vehicle_id: "",
        project_name: "",
        appointment_type: "",
        advisor_id: "",
        driver_name: "",
        pickup_address: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        notes: "",
      });
      setErrors({});
      setValidatedSteps(new Set());
      setCalendarDate(new Date());
      onClose();
    }
  };

  // Filtrar vehículos por cliente seleccionado
  const filteredVehicles = formData.client_id
    ? vehicles.filter((v) => {
        // Comparar el client_id del vehículo con el client_id seleccionado
        // El vehículo puede tener client_id como _id del cliente o como id normalizado
        // Por lo tanto, comparamos directamente con el formData.client_id que puede ser _id o id
        return v.client_id === formData.client_id;
      })
    : [];

  // Obtener información para el resumen
  const selectedBranch = branches.find((b) => {
    const branchWithId = b as Branch & { _id?: string };
    return (
      branchWithId._id === formData.branch_id || b.id === formData.branch_id
    );
  });
  const selectedClient = clients.find(
    (c) => c._id === formData.client_id || c.id === formData.client_id
  );
  const selectedVehicle = vehicles.find(
    (v) => v._id === formData.vehicle_id || v.id === formData.vehicle_id
  );

  // Funciones para el calendario
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date >= today) {
      // Formatear la fecha en hora local para evitar problemas de zona horaria
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      setFormData((prev) => ({ ...prev, appointment_date: dateString }));
      if (errors.appointment_date) {
        setErrors((prev) => ({ ...prev, appointment_date: undefined }));
      }
    }
  };

  const handlePreviousMonth = () => {
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
    );
  };

  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const weekDays = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

  const daysInMonth = getDaysInMonth(calendarDate);
  const firstDay = getFirstDayOfMonth(calendarDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Crear selectedDate en hora local para evitar problemas de zona horaria
  let selectedDate: Date | null = null;
  if (formData.appointment_date) {
    const [year, month, day] = formData.appointment_date.split("-").map(Number);
    selectedDate = new Date(year, month - 1, day);
    selectedDate.setHours(0, 0, 0, 0);
  }

  // Generar array de días del mes
  const calendarDays = [];
  // Días del mes anterior (para completar la primera semana)
  const prevMonthDays = getDaysInMonth(
    new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
  );
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
    });
  }
  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
    });
  }
  // Completar hasta 42 días (6 semanas)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Nueva Cita - Paso {currentStep} de 4
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step < currentStep
                        ? "bg-blue-600 text-white"
                        : step === currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
                    }`}
                  >
                    {step < currentStep ? <Check size={20} /> : step}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      step <= currentStep
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-zinc-400"
                    }`}
                  >
                    {step === 1 && "Sucursal"}
                    {step === 2 && "Vehículo"}
                    {step === 3 && "Detalles"}
                    {step === 4 && "Contacto"}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep
                        ? "bg-blue-600"
                        : "bg-gray-200 dark:bg-zinc-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Paso 1: Sucursal, Fecha y Hora */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Selecciona una sucursal{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChange}
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.branch_id
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                >
                  <option value="">Selecciona una sucursal</option>
                  {branches.map((branch) => {
                    // Preferir _id sobre id para mantener compatibilidad con MongoDB
                    const branchWithId = branch as Branch & { _id?: string };
                    const branchId = branchWithId._id || branch.id || "";
                    return (
                      <option key={branchId} value={branchId}>
                        {branch.name}
                      </option>
                    );
                  })}
                </select>
                {errors.branch_id && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.branch_id}
                  </p>
                )}
              </div>

              {/* Fecha y Hora en una sola fila */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendario - Lado izquierdo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Selecciona una fecha
                  </h3>
                  <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
                    {/* Header del calendario */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={handlePreviousMonth}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        {monthNames[calendarDate.getMonth()]}{" "}
                        {calendarDate.getFullYear()}
                      </h4>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {weekDays.map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-medium text-gray-500 dark:text-zinc-400 py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((calendarDay, index) => {
                        // Calcular la fecha correcta basándose en si es del mes actual o no
                        let dayDate: Date;
                        if (calendarDay.isCurrentMonth) {
                          dayDate = new Date(
                            calendarDate.getFullYear(),
                            calendarDate.getMonth(),
                            calendarDay.day
                          );
                        } else if (index < firstDay) {
                          // Días del mes anterior
                          dayDate = new Date(
                            calendarDate.getFullYear(),
                            calendarDate.getMonth() - 1,
                            calendarDay.day
                          );
                        } else {
                          // Días del mes siguiente
                          dayDate = new Date(
                            calendarDate.getFullYear(),
                            calendarDate.getMonth() + 1,
                            calendarDay.day
                          );
                        }
                        // Normalizar la hora para comparaciones correctas
                        dayDate.setHours(0, 0, 0, 0);

                        const isToday = dayDate.getTime() === today.getTime();
                        const isSelected =
                          selectedDate &&
                          dayDate.getTime() === selectedDate.getTime();
                        const isPast = dayDate < today && !isToday;
                        const isCurrentMonth = calendarDay.isCurrentMonth;

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() =>
                              !isPast && isCurrentMonth
                                ? handleDateSelect(dayDate)
                                : null
                            }
                            disabled={isPast || !isCurrentMonth}
                            className={`aspect-square text-sm font-medium rounded-lg transition-colors ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : isToday
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : isPast || !isCurrentMonth
                                ? "text-gray-300 dark:text-zinc-600 cursor-not-allowed"
                                : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                            }`}
                          >
                            {calendarDay.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {errors.appointment_date && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.appointment_date}
                    </p>
                  )}
                </div>

                {/* Horarios - Lado derecho */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Horarios disponibles
                  </h3>
                  {formData.appointment_date && (
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      {selectedDate &&
                        selectedDate.toLocaleDateString("es-MX", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeSelect(time)}
                        className={`px-4 py-3 rounded-xl border-2 transition-colors font-medium ${
                          formData.selected_time === time
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 text-gray-900 dark:text-white"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  {errors.selected_time && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.selected_time}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Cliente, Vehículo, Proyecto y Tipo de Reparación */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información del vehículo y proyecto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleChange}
                    className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                      errors.client_id
                        ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                        : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    }`}
                  >
                    <option value="">Selecciona un cliente</option>
                    {clients.map((client) => {
                      // Preferir _id sobre id para mantener compatibilidad con MongoDB
                      const clientId = client._id || client.id || "";
                      return (
                        <option key={clientId} value={clientId}>
                          {client.name}
                        </option>
                      );
                    })}
                  </select>
                  {errors.client_id && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.client_id}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Vehículo <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vehicle_id"
                    value={formData.vehicle_id}
                    onChange={handleChange}
                    disabled={!formData.client_id}
                    className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.vehicle_id
                        ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                        : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    }`}
                  >
                    <option value="">
                      {formData.client_id
                        ? "Selecciona un vehículo"
                        : "Primero selecciona un cliente"}
                    </option>
                    {filteredVehicles.map((vehicle) => {
                      // Preferir _id sobre id para mantener compatibilidad con MongoDB
                      const vehicleId = vehicle._id || vehicle.id || "";
                      return (
                        <option key={vehicleId} value={vehicleId}>
                          {vehicle.brand} {vehicle.model} {vehicle.year} -{" "}
                          {vehicle.license}
                        </option>
                      );
                    })}
                  </select>
                  {errors.vehicle_id && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.vehicle_id}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Proyecto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="project_name"
                    value={formData.project_name}
                    onChange={handleChange}
                    placeholder="Nombre del proyecto o número de orden"
                    className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                      errors.project_name
                        ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                        : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    }`}
                  />
                  {errors.project_name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.project_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Tipos de reparación (selecciona todos los que apliquen){" "}
                  <span className="text-red-500">*</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {REPAIR_TYPES.map((type) => {
                    // Verificar si el tipo está seleccionado
                    const currentTypes = formData.appointment_type
                      ? formData.appointment_type
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean)
                      : [];
                    const isSelected = currentTypes.includes(type);

                    return (
                      <label
                        key={type}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="appointment_type"
                          value={type}
                          checked={isSelected}
                          onChange={() => handleRepairTypeToggle(type)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {type}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {errors.appointment_type && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.appointment_type}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Asesor, Conductor y Dirección */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalles del servicio
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Asesor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="advisor_id"
                    value={formData.advisor_id}
                    onChange={handleChange}
                    placeholder="Selecciona un asesor"
                    className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                      errors.advisor_id
                        ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                        : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    }`}
                  />
                  {errors.advisor_id && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.advisor_id}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Conductor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="driver_name"
                    value={formData.driver_name}
                    onChange={handleChange}
                    placeholder="Nombre del conductor"
                    className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                      errors.driver_name
                        ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                        : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    }`}
                  />
                  {errors.driver_name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.driver_name}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Dirección de Entrada/Recolección{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="pickup_address"
                    value={formData.pickup_address}
                    onChange={handleChange}
                    placeholder="Dirección completa para recolección del vehículo"
                    rows={3}
                    className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                      errors.pickup_address
                        ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                        : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    }`}
                  />
                  {errors.pickup_address && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.pickup_address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Confirmación y Datos de Contacto */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información de contacto y confirmación
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    placeholder="Nombre completo del contacto"
                    className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                      validatedSteps.has(4) && errors.contact_name
                        ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                        : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    }`}
                  />
                  {validatedSteps.has(4) && errors.contact_name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.contact_name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="55-1234-5678"
                    className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                      validatedSteps.has(4) && errors.contact_phone
                        ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                        : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    }`}
                  />
                  {validatedSteps.has(4) && errors.contact_phone && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.contact_phone}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="contacto@ejemplo.com"
                    className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                      validatedSteps.has(4) && errors.contact_email
                        ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                        : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    }`}
                  />
                  {validatedSteps.has(4) && errors.contact_email && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.contact_email}
                    </p>
                  )}
                </div>
              </div>

              {/* Resumen de la cita */}
              <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Resumen de la cita
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">
                      Sucursal:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedBranch?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">
                      Fecha:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.appointment_date
                        ? new Date(
                            formData.appointment_date
                          ).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">
                      Hora:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.selected_time || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">
                      Cliente:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedClient?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">
                      Vehículo:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedVehicle
                        ? `${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.year} - ${selectedVehicle.license}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">
                      Proyecto:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.project_name || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">
                      Servicios:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.appointment_type || "0 seleccionados"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">
                      Asesor:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.advisor_id || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={currentStep === 1 ? handleClose : handlePrevious}
              disabled={loading}
              className="px-6 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft size={18} />
              {currentStep === 1 ? "Cancelar" : "Anterior"}
            </button>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                Siguiente
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creando...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Confirmar Cita
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
