export type MeetingStatus = "Upcoming" | "Active" | "Closed";

export interface Meeting {
  id: string;
  name: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:mm
  venue: string;
  organizer: string;
  department: string;
  description: string;
  status: MeetingStatus;
  attStart: string;    // HH:mm
  attEnd: string;      // HH:mm
  requireGps: boolean;
  requireRemarks: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  meetingId: string;
  meetingName: string;
  meetingDate: string;
  meetingTime: string;
  name: string;
  mobile: string;
  designation: string;
  department: string;
  remarks: string;
  latitude: number | null;
  longitude: number | null;
  browser: string;
  device: string;
  ip: string;
  attDate: string;
  attTime: string;
  createdAt: string;
}

export interface DB {
  meetings: Meeting[];
  attendance: AttendanceRecord[];
  seq: number;
}
