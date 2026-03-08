import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SectionItem {
  id: string;
  catalog_item_id: string;
  sort_order: number;
}

export interface Section {
  id: string;
  title: string;
  content_type: string;
  sort_order: number;
  items: SectionItem[];
}

export function useSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSections = useCallback(async () => {
    const { data: sData } = await supabase
      .from("sections")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!sData) {
      setLoading(false);
      return;
    }

    const { data: siData } = await supabase
      .from("section_items")
      .select("*")
      .order("sort_order", { ascending: true });

    const itemsMap = new Map<string, SectionItem[]>();
    (siData || []).forEach((si: any) => {
      const list = itemsMap.get(si.section_id) || [];
      list.push({ id: si.id, catalog_item_id: si.catalog_item_id, sort_order: si.sort_order });
      itemsMap.set(si.section_id, list);
    });

    setSections(
      sData.map((s: any) => ({
        id: s.id,
        title: s.title,
        content_type: s.content_type,
        sort_order: s.sort_order,
        items: itemsMap.get(s.id) || [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const createSection = useCallback(
    async (title: string, content_type: string) => {
      const maxOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.sort_order)) + 1 : 0;
      await supabase.from("sections").insert({ title, content_type, sort_order: maxOrder });
      await fetchSections();
    },
    [sections, fetchSections]
  );

  const updateSection = useCallback(
    async (id: string, patch: { title?: string; content_type?: string; sort_order?: number }) => {
      await supabase.from("sections").update(patch).eq("id", id);
      await fetchSections();
    },
    [fetchSections]
  );

  const deleteSection = useCallback(
    async (id: string) => {
      await supabase.from("sections").delete().eq("id", id);
      await fetchSections();
    },
    [fetchSections]
  );

  const setSectionItems = useCallback(
    async (sectionId: string, catalogItemIds: string[]) => {
      await supabase.from("section_items").delete().eq("section_id", sectionId);
      if (catalogItemIds.length > 0) {
        const rows = catalogItemIds.map((cid, i) => ({
          section_id: sectionId,
          catalog_item_id: cid,
          sort_order: i,
        }));
        await supabase.from("section_items").insert(rows);
      }
      await fetchSections();
    },
    [fetchSections]
  );

  return { sections, loading, createSection, updateSection, deleteSection, setSectionItems, refetch: fetchSections };
}
