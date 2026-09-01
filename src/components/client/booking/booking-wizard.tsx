"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CalendarHeart,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  PartyPopper,
  Calendar as CalendarIcon,
  MessageCircle,
  User,
  Phone,
  Mail,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice, formatTime24to12 } from "@/lib/business";
import { whatsappLink, bookingWhatsAppMessage } from "@/lib/notifications";

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  duration: number;
  isPerNail: boolean;
}

interface CategoryOption {
  categoryName: string;
  services: ServiceOption[];
}

interface Slot {
  start: string;
  end: string;
  label: string;
}

interface ExtraSelection {
  serviceId: string;
  name: string;
  price: number;
  isPerNail: boolean;
  quantity: number;
}

interface AppointmentResult {
  bookingRef: string;
  clientName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  extraDetails: { name: string; quantity: number; total: number }[];
}

type Step = "service" | "date" | "time" | "details" | "summary" | "confirmed";

export function BookingWizard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<Step>("service");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [extras, setExtras] = useState<ExtraSelection[]>([]);
  const [perNailQuantities, setPerNailQuantities] = useState<Record<string, number>>({});

  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [result, setResult] = useState<AppointmentResult | null>(null);

  // Load catalog
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/services", { cache: "no-store" });
        const data = await res.json();
        const cats: CategoryOption[] = data.categories.map((c: { categoryName: string; services: ServiceOption[] }) => ({
          categoryName: c.categoryName,
          services: c.services,
        }));
        setCategories(cats);
        setLoadingCatalog(false);

        const preset = searchParams.get("service");
        if (preset) {
          const extrasCat = cats.find((c) => c.categoryName === "EXTRAS");
          const mainCats = cats.filter((c) => c.categoryName !== "EXTRAS");
          const found = mainCats
            .flatMap((c) => c.services)
            .find((s) => s.name.toLowerCase() === preset.toLowerCase());
          if (found) selectService(found, cats);
          else setDateStep();
        }
      } catch {
        setLoadingCatalog(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate next 14 dates
  useEffect(() => {
    const list: string[] = [];
    const today = new Date();
    for (let i = 0; i < 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = `${d.getFullYear()}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      list.push(iso);
    }
    setDates(list);
  }, []);

  function selectService(
    service: ServiceOption,
    cats: CategoryOption[] = categories
  ) {
    setSelectedService(service);
    setExtras([]);
    setPerNailQuantities({});
    setSelectedDate("");
    setSelectedSlot(null);
    setStep("date");
    if (cats.length === 0) {
      router.replace("/book");
    }
  }

  function setDateStep() {
    setStep("date");
  }

  function toggleExtra(service: ServiceOption) {
    if (service.isPerNail) {
      setExtras((prev) => {
        const q = perNailQuantities[service.id] ?? 10;
        if (prev.some((e) => e.serviceId === service.id)) {
          return prev.filter((e) => e.serviceId !== service.id);
        }
        return [...prev, { serviceId: service.id, name: service.name, price: service.price, isPerNail: true, quantity: q }];
      });
    } else {
      setExtras((prev) => {
        if (prev.some((e) => e.serviceId === service.id)) {
          return prev.filter((e) => e.serviceId !== service.id);
        }
        return [...prev, { serviceId: service.id, name: service.name, price: service.price, isPerNail: false, quantity: 1 }];
      });
    }
  }

  function updatePerNailQuantity(serviceId: string, value: number, name: string, price: number) {
    setPerNailQuantities((prev) => ({ ...prev, [serviceId]: value }));
    setExtras((prev) =>
      prev.map((e) =>
        e.serviceId === serviceId ? { ...e, quantity: value } : e
      )
    );
  }

  async function loadSlots(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    setSlots([]);
    try {
      const duration = selectedService?.duration ?? 120;
      const res = await fetch(`/api/availability?date=${date}&duration=${duration}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        setSlots(data.slots ?? []);
      } else {
        setSlots([]);
      }
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  const extrasCategory = useMemo(
    () => categories.find((c) => c.categoryName === "EXTRAS"),
    [categories]
  );

  const mainCategories = useMemo(
    () => categories.filter((c) => c.categoryName !== "EXTRAS"),
    [categories]
  );

  const subtotal = useMemo(() => {
    let total = selectedService?.price ?? 0;
    for (const e of extras) {
      total += e.price * e.quantity;
    }
    return total;
  }, [selectedService, extras]);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (form.name.trim().length < 2) errors.name = "Please enter your full name.";
    if (form.phone.trim().length < 7) errors.phone = "Please enter a valid cellphone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Please enter a valid email address.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function confirmBooking() {
    if (!validateForm() || !selectedService || !selectedSlot) return;
    setBooking(true);
    setBookingError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          extras: extras.map((e) => ({
            serviceId: e.serviceId,
            quantity: e.quantity,
          })),
          date: selectedDate,
          startTime: selectedSlot.start,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          notes: form.notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult({
        bookingRef: data.appointment.bookingRef,
        clientName: data.appointment.clientName,
        serviceName: data.appointment.serviceName,
        date: data.appointment.date,
        startTime: data.appointment.startTime,
        endTime: data.appointment.endTime,
        price: data.appointment.price,
        extraDetails: data.appointment.extraDetails,
      });
      setStep("confirmed");
    } catch {
      setBookingError("Something went wrong. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  const selectionDate = selectedDate
    ? new Date(`${selectedDate}T00:00:00`)
    : null;

  if (step === "confirmed" && result) {
    return <ConfirmationScreen result={result} useRouterRouter={router} />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif-display text-3xl font-semibold sm:text-4xl">
          Book Your Appointment
        </h1>
        <p className="mt-2 text-foreground/60">Be You. Be Beautiful.</p>
      </div>

      {/* Stepper */}
      <div className="mx-auto mt-8 flex max-w-lg items-center justify-center gap-2">
        {(["service", "date", "time", "details", "summary"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                stepIndex(s) < stepIndex(step)
                  ? "bg-primary text-white"
                  : stepIndex(s) === stepIndex(step)
                    ? "bg-primary/20 text-primary-dark ring-2 ring-primary"
                    : "bg-primary/10 text-foreground/40"
              )}
            >
              {stepIndex(s) < stepIndex(step) ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < 4 && <div className="h-px w-6 bg-primary/20 sm:w-10" />}
          </div>
        ))}
      </div>

      <div className="mt-8">
        {step === "service" && (
          <ServiceStep
            loading={loadingCatalog}
            categories={categories}
            mainCategories={mainCategories}
            extrasCategory={extrasCategory}
            selectedServiceId={selectedService?.id}
            selectedExtras={extras}
            perNailQuantities={perNailQuantities}
            onSelectService={(s) => selectService(s, categories)}
            onToggleExtra={toggleExtra}
            onQtyChange={updatePerNailQuantity}
            total={subtotal}
            onContinue={() => {
              if (selectedService) {
                setStep("date");
              }
            }}
            onWhatsApp={() =>
              window.open(
                whatsappLink("Hello Bee-U by Bernie! I'd like some help choosing a service please."),
                "_blank"
              )
            }
          />
        )}

        {step === "date" && (
          <DateStep
            dates={dates}
            selectedDate={selectedDate}
            onSelect={loadSlots}
            onBack={() => setStep("service")}
            onContinue={() => selectedSlot && setStep("details")}
            selectedSlot={selectedSlot}
            slots={slots}
            loadingSlots={loadingSlots}
            onSelectSlot={(s) => setSelectedSlot(s)}
            onSelectDatePreselected={() => {
              if (selectedDate && slots.length > 0) setStep("time");
            }}
          />
        )}

        {step === "time" && (
          <TimeStep
            slot={selectedSlot}
            onBack={() => setStep("date")}
            onContinue={() => setStep("details")}
          />
        )}

        {step === "details" && (
          <DetailsStep
            form={form}
            errors={formErrors}
            onChange={(field, value) => setForm((p) => ({ ...p, [field]: value }))}
            onBack={() => setStep(selectedSlot ? "time" : "date")}
            onContinue={() => setStep("summary")}
          />
        )}

        {step === "summary" && (
          <SummaryStep
            service={selectedService}
            extras={extras}
            date={selectionDate}
            slot={selectedSlot}
            total={subtotal}
            clientName={form.name}
            booking={booking}
            error={bookingError}
            onBack={() => setStep("details")}
            onConfirm={confirmBooking}
          />
        )}
      </div>
    </div>
  );
}

function stepIndex(step: Step): number {
  return ["service", "date", "time", "details", "summary", "confirmed"].indexOf(step);
}

/* ------------------------------ Service Step ------------------------------ */

function ServiceStep(props: {
  loading: boolean;
  categories: CategoryOption[];
  mainCategories: CategoryOption[];
  extrasCategory?: CategoryOption;
  selectedServiceId?: string;
  selectedExtras: ExtraSelection[];
  perNailQuantities: Record<string, number>;
  onSelectService: (s: ServiceOption) => void;
  onToggleExtra: (s: ServiceOption) => void;
  onQtyChange: (id: string, qty: number, name: string, price: number) => void;
  total: number;
  onContinue: () => void;
  onWhatsApp: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-accent" />
          Choose Your Service
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {props.loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-foreground/50">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading services...
          </div>
        )}

        {!props.loading && (
          <>
            <div className="space-y-5">
              {props.mainCategories.map((cat) => (
                <div key={cat.categoryName}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                    {cat.categoryName}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {cat.services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => props.onSelectService(s)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-4 text-left transition",
                          props.selectedServiceId === s.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-primary/15 bg-white hover:border-primary/40"
                        )}
                        aria-pressed={props.selectedServiceId === s.id}
                      >
                        <span>
                          <span className="block text-sm font-medium">{s.name}</span>
                          <span className="mt-0.5 block text-xs text-foreground/50">
                            {s.duration > 0 ? `~${s.duration} min` : "Add-on"}
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-primary-dark">
                          {formatPrice(s.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {props.extrasCategory && (
              <div className="border-t border-primary/10 pt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  Extras <span className="font-normal normal-case">(optional)</span>
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {props.extrasCategory.services.map((s) => {
                    const selected = props.selectedExtras.some(
                      (e) => e.serviceId === s.id
                    );
                    return (
                      <div key={s.id}>
                        <button
                          type="button"
                          onClick={() => props.onToggleExtra(s)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border p-4 text-left transition",
                            selected
                              ? "border-accent bg-accent/10 ring-1 ring-accent"
                              : "border-primary/15 bg-white hover:border-accent/40"
                          )}
                          aria-pressed={selected}
                        >
                          <span className="text-sm font-medium">{s.name}</span>
                          <span className="text-sm font-semibold text-primary-dark">
                            {s.isPerNail
                              ? `${formatPrice(s.price)}/nail`
                              : formatPrice(s.price)}
                          </span>
                        </button>
                        {selected && s.isPerNail && (
                          <div className="mt-2 flex items-center gap-2 px-1">
                            <Label htmlFor={`qty-${s.id}`} className="text-xs">
                              Nails:
                            </Label>
                            <Input
                              id={`qty-${s.id}`}
                              type="number"
                              min={1}
                              max={10}
                              value={props.perNailQuantities[s.id] ?? 10}
                              onChange={(e) =>
                                props.onQtyChange(
                                  s.id,
                                  Math.max(1, Math.min(10, parseInt(e.target.value) || 1)),
                                  s.name,
                                  s.price
                                )
                              }
                              className="h-9 w-20"
                            />
                            <span className="text-xs text-foreground/50">
                              +{formatPrice(s.price * (props.perNailQuantities[s.id] ?? 10))}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-primary/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <span className="text-foreground/50">Total: </span>
                <span className="text-lg font-semibold text-primary-dark">
                  {formatPrice(props.total)}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="ghost" size="sm" onClick={props.onWhatsApp}>
                  Need help deciding?
                </Button>
                <Button onClick={props.onContinue} disabled={!props.selectedServiceId}>
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Date & Time ------------------------------ */

function DateStep(props: {
  dates: string[];
  selectedDate: string;
  selectedSlot: Slot | null;
  slots: Slot[];
  loadingSlots: boolean;
  onSelect: (date: string) => void;
  onSelectSlot: (s: Slot) => void;
  onBack: () => void;
  onContinue: () => void;
  onSelectDatePreselected: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarIcon className="h-5 w-5 text-accent" />
          Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
          Choose a date
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {props.dates.map((d) => {
            const date = new Date(`${d}T00:00:00`);
            const dayName = date.toLocaleDateString("en-ZA", { weekday: "short" });
            const dayNum = date.getDate();
            const month = date.toLocaleDateString("en-ZA", { month: "short" });
            const isSelected = props.selectedDate === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => props.onSelect(d)}
                className={cn(
                  "flex flex-col items-center rounded-xl border p-3 text-center transition",
                  isSelected
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-primary/15 bg-white hover:border-primary/40"
                )}
                aria-pressed={isSelected}
              >
                <span className="text-xs font-medium uppercase text-foreground/50">
                  {dayName}
                </span>
                <span className="mt-1 text-xl font-semibold">{dayNum}</span>
                <span className="text-xs text-foreground/50">{month}</span>
              </button>
            );
          })}
        </div>

        {props.selectedDate && (
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Available times
            </h3>
            {props.loadingSlots && (
              <div className="flex items-center justify-center gap-2 py-6 text-foreground/50">
                <Loader2 className="h-5 w-5 animate-spin" />
                Checking availability...
              </div>
            )}
            {!props.loadingSlots && props.slots.length === 0 && (
              <p className="rounded-xl bg-primary/5 p-4 text-sm text-foreground/60">
                No appointments are available for this date. Please choose another date.
              </p>
            )}
            {!props.loadingSlots && props.slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {props.slots.map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    onClick={() => props.onSelectSlot(s)}
                    className={cn(
                      "rounded-xl border p-3 text-center text-sm font-medium transition",
                      props.selectedSlot?.start === s.start
                        ? "border-primary bg-primary text-white"
                        : "border-primary/15 bg-white hover:border-primary/40"
                    )}
                  >
                    {formatTime24to12(s.start)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={props.onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {props.selectedDate && props.slots.length > 0 && (
            <Button onClick={props.onContinue} disabled={!props.selectedSlot}>
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TimeStep(props: {
  slot: Slot | null;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your selected time</CardTitle>
      </CardHeader>
      <CardContent>
        {props.slot && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="text-3xl font-semibold text-primary-dark">
              {formatTime24to12(props.slot.start)}
            </p>
            <p className="mt-1 text-sm text-foreground/60">
              until {formatTime24to12(props.slot.end)}
            </p>
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={props.onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button onClick={props.onContinue}>Continue <ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Details ------------------------------ */

function DetailsStep(props: {
  form: { name: string; phone: string; email: string; notes: string };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Details</CardTitle>
        <p className="text-sm text-foreground/50">
          No account needed. We use this to confirm your appointment.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <div className="relative mt-1">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <Input
              id="name"
              className={cn("pl-10", props.errors.name && "border-red-400")}
              value={props.form.name}
              onChange={(e) => props.onChange("name", e.target.value)}
              placeholder="e.g. Sarah Williams"
              autoComplete="name"
            />
          </div>
          {props.errors.name && (
            <p className="mt-1 text-xs text-red-600">{props.errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Cellphone Number</Label>
          <div className="relative mt-1">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <Input
              id="phone"
              className={cn("pl-10", props.errors.phone && "border-red-400")}
              value={props.form.phone}
              onChange={(e) => props.onChange("phone", e.target.value)}
              placeholder="e.g. 082 123 4567"
              autoComplete="tel"
            />
          </div>
          {props.errors.phone && (
            <p className="mt-1 text-xs text-red-600">{props.errors.phone}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <div className="relative mt-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <Input
              id="email"
              className={cn("pl-10", props.errors.email && "border-red-400")}
              value={props.form.email}
              onChange={(e) => props.onChange("email", e.target.value)}
              placeholder="e.g. sarah@example.com"
              autoComplete="email"
            />
          </div>
          {props.errors.email && (
            <p className="mt-1 text-xs text-red-600">{props.errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <div className="relative mt-1">
            <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-foreground/40" />
            <Textarea
              id="notes"
              className="pl-10"
              value={props.form.notes}
              onChange={(e) => props.onChange("notes", e.target.value)}
              placeholder="Anything we should know? Allergies, inspiration, etc."
              maxLength={500}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={props.onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button onClick={props.onContinue}>
            Review Booking <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Summary ------------------------------ */

function SummaryStep(props: {
  service: ServiceOption | null;
  extras: ExtraSelection[];
  date: Date | null;
  slot: Slot | null;
  total: number;
  clientName: string;
  booking: boolean;
  error: string;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Confirm Your Appointment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <Row label="Business" value="Bee-U by Bernie" />
          <Row label="Client" value={props.clientName || "—"} />
          {props.service && <Row label="Service" value={props.service.name} />}
          {props.extras.length > 0 && (
            <Row
              label="Extras"
              value={props.extras
                .map((e) =>
                  e.isPerNail ? `${e.name} ×${e.quantity}` : e.name
                )
                .join(", ")}
            />
          )}
          <Row
            label="Date"
            value={
              props.date
                ? props.date.toLocaleDateString("en-ZA", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"
            }
          />
          {props.slot && (
            <Row
              label="Time"
              value={`${formatTime24to12(props.slot.start)} – ${formatTime24to12(props.slot.end)}`}
            />
          )}
          {props.service && (
            <Row
              label="Duration"
              value={`${props.service.duration > 0 ? props.service.duration : 120} minutes`}
            />
          )}
          <Row label="Price" value={formatPrice(props.total)} strong />
        </div>

        {props.error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {props.error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={props.onBack} disabled={props.booking}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button onClick={props.onConfirm} disabled={props.booking}>
            {props.booking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Booking appointment...
              </>
            ) : (
              <>
                <Check className="mr-1 h-4 w-4" /> Confirm Booking
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-foreground/50">{label}</span>
      <span className={cn("text-right", strong && "font-semibold text-primary-dark")}>
        {value}
      </span>
    </div>
  );
}

/* --------------------------- Confirmation --------------------------- */

function ConfirmationScreen({
  result,
  useRouterRouter,
}: {
  result: AppointmentResult;
  useRouterRouter: ReturnType<typeof useRouter>;
}) {
  const dateObj = new Date(result.date);
  const dateLabel = dateObj.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const waMessage = bookingWhatsAppMessage({
    bookingRef: result.bookingRef,
    serviceName: result.serviceName,
    date: dateLabel,
    startTime: result.startTime,
    endTime: result.endTime,
    price: result.price,
  });

  function addToCalendar() {
    const startISO = new Date(result.date);
    const [sh, sm] = result.startTime.split(":").map(Number);
    startISO.setHours(sh, sm, 0, 0);
    const endISO = new Date(startISO.getTime());
    const [eh, em] = result.endTime.split(":").map(Number);
    endISO.setHours(eh, em, 0, 0);

    const fmt = (d: Date) => {
      const p = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
    };

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Nails at Bee-U by Bernie - ${result.serviceName}`
    )}&dates=${fmt(startISO)}/${fmt(endISO)}&details=${encodeURIComponent(
      `Booking ref: ${result.bookingRef}\nBe You. Be Beautiful.`
    )}&location=${encodeURIComponent("Bee-U by Bernie")}`;
    window.open(url, "_blank");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <PartyPopper className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="mt-6 font-serif-display text-3xl font-semibold">
          Appointment Confirmed!
        </h1>
        <p className="mt-2 text-foreground/60">
          Thank you, {result.clientName.split(" ")[0]}. We can&apos;t wait to see you.
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="space-y-3 p-6 text-sm">
          <Row label="Booking Reference" value={result.bookingRef} strong />
          <Row label="Service" value={result.serviceName} />
          {result.extraDetails.length > 0 && (
            <Row
              label="Extras"
              value={result.extraDetails
                .map((e) => (e.quantity > 1 ? `${e.name} ×${e.quantity}` : e.name))
                .join(", ")}
            />
          )}
          <Row label="Date" value={dateLabel} />
          <Row
            label="Time"
            value={`${formatTime24to12(result.startTime)} – ${formatTime24to12(result.endTime)}`}
          />
          <Row label="Price" value={formatPrice(result.price)} strong />
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs text-foreground/50">
        A secure cancellation link has been emailed to you. You can reschedule or
        cancel anytime before your appointment.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Button
          variant="outline"
          onClick={addToCalendar}
          className="w-full"
        >
          <CalendarIcon className="mr-2 h-4 w-4" /> Add to Calendar
        </Button>
        <a
          href={whatsappLink(waMessage)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="whatsapp" className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" /> Send via WhatsApp
          </Button>
        </a>
        <Button
          variant="secondary"
          onClick={() => useRouterRouter.push("/book")}
          className="w-full sm:col-span-2"
        >
          <CalendarHeart className="mr-2 h-4 w-4" /> Book Another Appointment
        </Button>
      </div>
    </div>
  );
}