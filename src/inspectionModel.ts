import { supabase } from "./supabase";

export type InspectionResponseType =
  | "pass_fail"
  | "pass_fail_na"
  | "text"
  | "number"
  | "meter"
  | "photo";
export type InspectionStatus = "Draft" | "Passed" | "Failed" | "Submitted";

export type InspectionTemplateItem = {
  id: string;
  label: string;
  responseType: InspectionResponseType;
  required: boolean;
  instructions: string;
  position: number;
};
export type InspectionTemplate = {
  id: string;
  name: string;
  description: string;
  vehicleTypes: string[];
  vehicleIds: string[];
  cadenceDays: number | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: InspectionTemplateItem[];
};
export type InspectionResponse = {
  itemId: string;
  value: string | number | null;
  notes: string;
  photoPaths: string[];
};
export type Inspection = {
  id: string;
  templateId: string;
  templateName: string;
  vehicleId: string;
  status: InspectionStatus;
  notes: string;
  startedAt: string;
  submittedAt: string | null;
  updatedAt: string;
  responses: InspectionResponse[];
};
export type InspectionIssue = {
  id: string;
  vehicleId: string;
  inspectionId: string;
  inspectionItemId: string;
  title: string;
  description: string;
  status: "Open" | "Resolved";
  createdAt: string;
};

const templatesKey = "sws-fleet.inspection-templates.v1";
const inspectionsKey = "sws-fleet.inspections.v1";
const issuesKey = "sws-fleet.inspection-issues.v1";
const now = () => new Date().toISOString();

export const seedTemplate: InspectionTemplate = {
  id: "sws-truck-pretrip",
  name: "SWS Truck Pre-Trip Inspection",
  description: "Daily safety and readiness check for Summit West Signs trucks.",
  vehicleTypes: ["Truck"],
  vehicleIds: [],
  cadenceDays: 1,
  archivedAt: null,
  createdAt: "2026-09-14T00:00:00.000Z",
  updatedAt: "2026-09-14T00:00:00.000Z",
  items: [
    [
      "walkaround",
      "Walkaround damage check",
      "pass_fail_na",
      true,
      "Walk around the vehicle and note new damage.",
    ],
    [
      "tires",
      "Tires, wheels, and lug nuts",
      "pass_fail_na",
      true,
      "Check inflation, tread, visible damage, and loose hardware.",
    ],
    [
      "lights",
      "Headlights, signals, brake and warning lights",
      "pass_fail_na",
      true,
      "Confirm all required lamps operate.",
    ],
    [
      "brakes",
      "Service and parking brakes",
      "pass_fail",
      true,
      "Confirm firm pedal pressure and parking-brake hold.",
    ],
    [
      "fluids",
      "Leaks and fluid levels",
      "pass_fail_na",
      true,
      "Look beneath the truck and check accessible fluid levels.",
    ],
    [
      "cab",
      "Seat belts, mirrors, horn, and windshield",
      "pass_fail",
      true,
      "Confirm cab safety equipment and clear visibility.",
    ],
    [
      "equipment",
      "Boom, crane, outriggers, and controls",
      "pass_fail_na",
      true,
      "Inspect only equipment installed on this truck.",
    ],
    [
      "load",
      "Load, tools, and sign materials secured",
      "pass_fail",
      true,
      "Confirm cargo and exterior compartments are secured.",
    ],
    [
      "meter",
      "Odometer or hour-meter reading",
      "meter",
      true,
      "Enter the current primary vehicle meter.",
    ],
    [
      "photo",
      "Vehicle condition photo",
      "photo",
      true,
      "Take a current exterior photo showing the vehicle condition.",
    ],
    [
      "notes",
      "Additional observations",
      "text",
      false,
      "Record anything the next operator or fleet manager should know.",
    ],
  ].map(([id, label, responseType, required, instructions], position) => ({
    id: String(id),
    label: String(label),
    responseType: responseType as InspectionResponseType,
    required: Boolean(required),
    instructions: String(instructions),
    position,
  })),
};

export function validateInspectionTemplate(template: InspectionTemplate) {
  if (!template.name.trim()) return "Enter a template name.";
  if (!template.vehicleTypes.length && !template.vehicleIds.length)
    return "Assign the template to a vehicle type or vehicle.";
  if (!template.items.length) return "Add at least one inspection item.";
  if (template.items.some((item) => !item.label.trim()))
    return "Every inspection item needs a label.";
  if (
    template.cadenceDays !== null &&
    (!Number.isInteger(template.cadenceDays) || template.cadenceDays < 1)
  )
    return "Cadence must be at least one day.";
  return "";
}

const answered = (response: InspectionResponse | undefined) =>
  response !== undefined &&
  response.value !== "" &&
  response.value !== null &&
  (response.photoPaths.length > 0 || response.value !== "photo");
export function requiredInspectionItemsMissing(
  template: InspectionTemplate,
  inspection: Inspection,
) {
  return template.items
    .filter(
      (item) =>
        item.required &&
        !answered(inspection.responses.find((response) => response.itemId === item.id)),
    )
    .map((item) => item.label);
}
export function inspectionStatus(
  template: InspectionTemplate,
  inspection: Inspection,
): InspectionStatus {
  if (requiredInspectionItemsMissing(template, inspection).length) return "Draft";
  return inspection.responses.some((response) => response.value === "fail") ? "Failed" : "Passed";
}
export function isInspectionOverdue(
  template: InspectionTemplate,
  inspections: Inspection[],
  vehicleId: string,
  at = new Date(),
) {
  if (!template.cadenceDays || template.archivedAt) return false;
  const latest = inspections
    .filter(
      (item) => item.vehicleId === vehicleId && item.templateId === template.id && item.submittedAt,
    )
    .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))[0];
  return (
    !latest || at.getTime() - Date.parse(latest.submittedAt!) > template.cadenceDays * 86400000
  );
}
export function createInspectionIssue(
  inspection: Inspection,
  item: InspectionTemplateItem,
): InspectionIssue {
  return {
    id: crypto.randomUUID(),
    vehicleId: inspection.vehicleId,
    inspectionId: inspection.id,
    inspectionItemId: item.id,
    title: `Failed inspection: ${item.label}`,
    description: `Created from ${inspection.templateName}.`,
    status: "Open",
    createdAt: now(),
  };
}

const fromTemplateRow = (row: Record<string, unknown>): InspectionTemplate => ({
  id: String(row.id),
  name: String(row.name),
  description: String(row.description ?? ""),
  vehicleTypes: (row.vehicle_types as string[]) ?? [],
  vehicleIds: (row.vehicle_ids as string[]) ?? [],
  cadenceDays: row.cadence_days == null ? null : Number(row.cadence_days),
  archivedAt: row.archived_at ? String(row.archived_at) : null,
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
  items: ((row.inspection_template_items as Record<string, unknown>[]) ?? [])
    .map((item) => ({
      id: String(item.id),
      label: String(item.label),
      responseType: item.response_type as InspectionResponseType,
      required: Boolean(item.required),
      instructions: String(item.instructions ?? ""),
      position: Number(item.position),
    }))
    .sort((a, b) => a.position - b.position),
});
const fromInspectionRow = (row: Record<string, unknown>): Inspection => ({
  id: String(row.id),
  templateId: String(row.template_id),
  templateName: String(
    (row.inspection_templates as Record<string, unknown>)?.name ??
      row.template_name ??
      "Inspection",
  ),
  vehicleId: String(row.vehicle_id),
  status: row.status as InspectionStatus,
  notes: String(row.notes ?? ""),
  startedAt: String(row.started_at),
  submittedAt: row.submitted_at ? String(row.submitted_at) : null,
  updatedAt: String(row.updated_at),
  responses: ((row.inspection_responses as Record<string, unknown>[]) ?? []).map((response) => ({
    itemId: String(response.template_item_id),
    value:
      response.value_number == null
        ? response.value_text == null
          ? null
          : String(response.value_text)
        : Number(response.value_number),
    notes: String(response.notes ?? ""),
    photoPaths: (response.photo_paths as string[]) ?? [],
  })),
});

export async function loadInspectionTemplates(): Promise<InspectionTemplate[]> {
  if (!supabase) {
    const stored = JSON.parse(localStorage.getItem(templatesKey) ?? "[]") as InspectionTemplate[];
    return stored.length ? stored : [seedTemplate];
  }
  const { data, error } = await supabase
    .from("inspection_templates")
    .select("*, inspection_template_items(*)")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromTemplateRow);
}
export async function saveInspectionTemplate(
  template: InspectionTemplate,
): Promise<InspectionTemplate> {
  const validation = validateInspectionTemplate(template);
  if (validation) throw new Error(validation);
  if (!supabase) {
    const existing = await loadInspectionTemplates();
    const stamp = now();
    const saved = {
      ...template,
      id: template.id || crypto.randomUUID(),
      updatedAt: stamp,
      createdAt: template.createdAt || stamp,
    };
    localStorage.setItem(
      templatesKey,
      JSON.stringify(
        existing.some((t) => t.id === saved.id)
          ? existing.map((t) => (t.id === saved.id ? saved : t))
          : [...existing, saved],
      ),
    );
    return saved;
  }
  const row = {
    name: template.name.trim(),
    description: template.description,
    vehicle_types: template.vehicleTypes,
    vehicle_ids: template.vehicleIds,
    cadence_days: template.cadenceDays,
    archived_at: template.archivedAt,
  };
  const request = template.id
    ? supabase.from("inspection_templates").update(row).eq("id", template.id)
    : supabase.from("inspection_templates").insert(row);
  const { data, error } = await request.select("*").single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Template save could not be confirmed.");
  const templateId = String(data.id);
  if (template.id) {
    const deleted = await supabase
      .from("inspection_template_items")
      .delete()
      .eq("template_id", templateId);
    if (deleted.error) throw new Error(deleted.error.message);
  }
  const inserted = await supabase
    .from("inspection_template_items")
    .insert(
      template.items.map((item, position) => ({
        template_id: templateId,
        label: item.label,
        response_type: item.responseType,
        required: item.required,
        instructions: item.instructions,
        position,
      })),
    )
    .select("*");
  if (inserted.error) throw new Error(inserted.error.message);
  return fromTemplateRow({ ...data, inspection_template_items: inserted.data ?? [] });
}
export async function loadInspections(): Promise<Inspection[]> {
  if (!supabase) return JSON.parse(localStorage.getItem(inspectionsKey) ?? "[]");
  const { data, error } = await supabase
    .from("inspections")
    .select("*, inspection_templates(name), inspection_responses(*)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromInspectionRow);
}
export async function saveInspection(inspection: Inspection): Promise<Inspection> {
  if (!supabase) {
    const list = await loadInspections();
    const saved = { ...inspection, id: inspection.id || crypto.randomUUID(), updatedAt: now() };
    localStorage.setItem(
      inspectionsKey,
      JSON.stringify(
        list.some((i) => i.id === saved.id)
          ? list.map((i) => (i.id === saved.id ? saved : i))
          : [saved, ...list],
      ),
    );
    return saved;
  }
  const finalStatus = inspection.status;
  const baseRow = {
    template_id: inspection.templateId,
    vehicle_id: inspection.vehicleId,
    status: "Draft",
    notes: inspection.notes,
    started_at: inspection.startedAt,
    submitted_at: null,
  };
  let inspectionId = inspection.id;
  let data: Record<string, unknown> | null = null;
  if (!inspectionId) {
    const created = await supabase.from("inspections").insert(baseRow).select("*").single();
    if (created.error) throw new Error(created.error.message);
    if (!created.data) throw new Error("Inspection save could not be confirmed.");
    data = created.data;
    inspectionId = String(created.data.id);
  }
  if (inspection.id) {
    const deleted = await supabase
      .from("inspection_responses")
      .delete()
      .eq("inspection_id", inspectionId);
    if (deleted.error) throw new Error(deleted.error.message);
  }
  if (inspection.responses.length) {
    const saved = await supabase
      .from("inspection_responses")
      .insert(
        inspection.responses.map((response) => ({
          inspection_id: inspectionId,
          template_item_id: response.itemId,
          value_text: typeof response.value === "string" ? response.value : null,
          value_number: typeof response.value === "number" ? response.value : null,
          notes: response.notes,
          photo_paths: response.photoPaths,
        })),
      );
    if (saved.error) throw new Error(saved.error.message);
  }
  const updated = await supabase
    .from("inspections")
    .update({ ...baseRow, status: finalStatus, submitted_at: inspection.submittedAt })
    .eq("id", inspectionId)
    .select("*")
    .single();
  if (updated.error) throw new Error(updated.error.message);
  data = updated.data;
  if (!data) throw new Error("Inspection save could not be confirmed.");
  return {
    ...inspection,
    id: inspectionId,
    updatedAt: String(data.updated_at),
    startedAt: String(data.started_at),
  };
}
export async function uploadInspectionPhoto(inspectionId: string, itemId: string, file: File) {
  if (!supabase) return URL.createObjectURL(file);
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${inspectionId}/${itemId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("inspection-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}
export async function loadInspectionIssues(): Promise<InspectionIssue[]> {
  if (!supabase) return JSON.parse(localStorage.getItem(issuesKey) ?? "[]");
  const { data, error } = await supabase
    .from("inspection_issues")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    inspectionId: String(row.inspection_id),
    inspectionItemId: String(row.inspection_item_id),
    title: String(row.title),
    description: String(row.description),
    status: row.status as "Open" | "Resolved",
    createdAt: String(row.created_at),
  }));
}
export async function saveInspectionIssue(issue: InspectionIssue) {
  if (!supabase) {
    const issues = await loadInspectionIssues();
    localStorage.setItem(issuesKey, JSON.stringify([issue, ...issues]));
    return issue;
  }
  const { data, error } = await supabase
    .from("inspection_issues")
    .insert({
      vehicle_id: issue.vehicleId,
      inspection_id: issue.inspectionId,
      inspection_item_id: issue.inspectionItemId,
      title: issue.title,
      description: issue.description,
      status: issue.status,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Issue save could not be confirmed.");
  return { ...issue, id: String(data.id), createdAt: String(data.created_at) };
}
