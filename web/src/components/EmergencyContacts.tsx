"use client";
import { useState, useEffect } from "react";
import { getEmergencyContacts, addEmergencyContact, deleteEmergencyContact } from "@/lib/api";
import { EmergencyContact } from "@/lib/types";
import { PlusIcon, PhoneIcon, XIcon } from "./Icons";

interface EmergencyContactsProps {
  dark?: boolean;
}

export default function EmergencyContacts({ dark }: EmergencyContactsProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchContacts = async () => {
    try {
      const res = await getEmergencyContacts();
      setContacts(res.data);
    } catch {}
  };

  useEffect(() => { fetchContacts(); }, []);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await addEmergencyContact({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        relationship_type: relationship.trim() || undefined,
      });
      setName(""); setPhone(""); setEmail(""); setRelationship("");
      setShowForm(false);
      fetchContacts();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add contact.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEmergencyContact(id);
      fetchContacts();
    } catch {
      setError("Failed to delete contact");
    }
  };

  if (dark) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Emergency Contacts</p>
          <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-all ${showForm ? "bg-white/10 border-white/20 text-white" : "bg-emerald-500/15 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25"}`}>
            {showForm ? <XIcon size={12} /> : <PlusIcon size={12} />}
            {showForm ? "Cancel" : "Add"}
          </button>
        </div>
        {error && (<div className="bg-red-500/15 border border-red-500/25 rounded-xl px-3 py-2 text-xs text-red-300">{error}</div>)}
        {showForm && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 space-y-2">
            <input type="text" placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 text-white rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-emerald-500/50 focus:outline-none placeholder:text-gray-600" />
            <input type="tel" placeholder="Phone * (e.g. +91...)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white/5 text-white rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-emerald-500/50 focus:outline-none placeholder:text-gray-600" />
            <input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 text-white rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-emerald-500/50 focus:outline-none placeholder:text-gray-600" />
            <input type="text" placeholder="Relationship (e.g. Mother, Friend)" value={relationship} onChange={(e) => setRelationship(e.target.value)} className="w-full bg-white/5 text-white rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-emerald-500/50 focus:outline-none placeholder:text-gray-600" />
            <button onClick={handleAdd} disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-30 text-white rounded-lg py-2 text-sm font-medium transition-all">{loading ? "Saving..." : "Save Contact"}</button>
          </div>
        )}
        {contacts.length === 0 ? (
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
            <PhoneIcon size={24} />
            <p className="text-gray-400 text-sm mt-2">No contacts yet</p>
            <p className="text-gray-600 text-xs mt-1">Add contacts to receive SOS alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-3 bg-white/5 rounded-xl border border-white/10 px-3.5 py-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{contact.name.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-medium truncate">{contact.name}</p>
                    {contact.relationship_type && (<span className="text-[9px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded shrink-0">{contact.relationship_type}</span>)}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{contact.phone}</p>
                </div>
                <button onClick={() => handleDelete(contact.id)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0"><XIcon size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Light mode
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-700 font-bold uppercase tracking-wider">Emergency Contacts</p>
        <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${showForm ? "bg-gray-100 border-gray-300 text-gray-600" : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"}`}>
          {showForm ? <XIcon size={12} /> : <PlusIcon size={12} />}
          {showForm ? "Cancel" : "Add"}
        </button>
      </div>
      {error && (<div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 font-medium">{error}</div>)}
      {showForm && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
          <input type="text" placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white text-gray-800 rounded-lg px-3 py-2.5 text-sm border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 placeholder:text-gray-400" />
          <input type="tel" placeholder="Phone * (e.g. +91...)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white text-gray-800 rounded-lg px-3 py-2.5 text-sm border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 placeholder:text-gray-400" />
          <input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white text-gray-800 rounded-lg px-3 py-2.5 text-sm border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 placeholder:text-gray-400" />
          <input type="text" placeholder="Relationship (e.g. Mother, Friend)" value={relationship} onChange={(e) => setRelationship(e.target.value)} className="w-full bg-white text-gray-800 rounded-lg px-3 py-2.5 text-sm border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 placeholder:text-gray-400" />
          <button onClick={handleAdd} disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-30 text-white rounded-lg py-2.5 text-sm font-bold transition-all shadow-md shadow-emerald-500/15">{loading ? "Saving..." : "Save Contact"}</button>
        </div>
      )}
      {contacts.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-gray-300 flex justify-center"><PhoneIcon size={28} /></div>
          <p className="text-gray-600 text-sm mt-3 font-medium">No contacts yet</p>
          <p className="text-gray-600 text-xs mt-1">Add contacts to receive SOS alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 hover:bg-gray-100 transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md">{contact.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-800 font-bold truncate">{contact.name}</p>
                  {contact.relationship_type && (<span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium shrink-0">{contact.relationship_type}</span>)}
                </div>
                <p className="text-xs text-gray-600 truncate">{contact.phone}</p>
              </div>
              <button onClick={() => handleDelete(contact.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0"><XIcon size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
