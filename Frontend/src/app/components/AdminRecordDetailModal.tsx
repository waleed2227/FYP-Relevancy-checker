import React from 'react';
import { X, Mail, User, GraduationCap, UserCircle, Calendar, FileText } from 'lucide-react';

export type AdminRecordDetail =
  | {
      kind: 'user';
      name: string;
      email: string;
      role: string;
      department: string;
      status: string;
      joinedDate: string;
      projectsCount: number;
    }
  | {
      kind: 'student';
      name: string;
      email: string;
      studentId: string;
      department: string;
      status: string;
      joinedDate: string;
      projectsCount: number;
    }
  | {
      kind: 'professor';
      name: string;
      email: string;
      professorId: string;
      department: string;
      status: string;
      joinedDate: string;
      projectsSupervised: number;
    };

interface AdminRecordDetailModalProps {
  record: AdminRecordDetail;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white text-right font-medium">{value}</span>
    </div>
  );
}

export default function AdminRecordDetailModal({ record, onClose }: AdminRecordDetailModalProps) {
  const title =
    record.kind === 'user' ? 'User Details' : record.kind === 'student' ? 'Student Profile' : 'Professor Profile';

  const Icon = record.kind === 'student' ? GraduationCap : record.kind === 'professor' ? UserCircle : User;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-1">
          <Row label="Full name" value={record.name} />
          <Row
            label="Email"
            value={
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {record.email}
              </span>
            }
          />
          {record.kind === 'user' && (
            <>
              <Row label="Role" value={record.role} />
              <Row label="Department" value={record.department} />
              <Row label="Status" value={record.status} />
              <Row label="Projects" value={record.projectsCount} />
              <Row label="Joined" value={record.joinedDate} />
            </>
          )}
          {record.kind === 'student' && (
            <>
              <Row label="Student ID" value={record.studentId} />
              <Row label="Department" value={record.department} />
              <Row label="Status" value={record.status} />
              <Row label="Projects submitted" value={record.projectsCount} />
              <Row label="Joined" value={record.joinedDate} />
            </>
          )}
          {record.kind === 'professor' && (
            <>
              <Row label="Professor ID" value={record.professorId} />
              <Row label="Department" value={record.department} />
              <Row label="Status" value={record.status} />
              <Row
                label="Projects supervised"
                value={
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {record.projectsSupervised}
                  </span>
                }
              />
              <Row
                label="Joined"
                value={
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {record.joinedDate}
                  </span>
                }
              />
            </>
          )}
        </div>

        <div className="p-6 pt-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Data loaded from the admin list API (PostgreSQL).
          </p>
        </div>
      </div>
    </div>
  );
}
