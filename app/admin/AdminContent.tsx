"use client";

import { useState } from "react";
import SeasonManagement from "@/components/admin/SeasonManagement";
import FightEntry from "@/components/admin/FightEntry";
import JsonImport from "@/components/admin/JsonImport";
import FightEditor from "@/components/admin/FightEditor";

const tabs = [
  { id: "seasons", label: "Saisons" },
  { id: "add-fight", label: "Ajouter combat" },
  { id: "json-import", label: "Import JSON" },
  { id: "edit-fights", label: "Éditer combats" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState<TabId>("seasons");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Administration</h2>
      </div>

      <div className="flex space-x-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "seasons" && <SeasonManagement />}
        {activeTab === "add-fight" && <FightEntry />}
        {activeTab === "json-import" && <JsonImport />}
        {activeTab === "edit-fights" && <FightEditor />}
      </div>
    </div>
  );
}
