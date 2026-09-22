import type { ReactNode, SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {children}
    </svg>
  );
}

export function PencilIcon(props: IconProps) { return <BaseIcon {...props}><path d="m4 16.5-.8 3.8 3.8-.8L18.8 7.7a2.1 2.1 0 0 0-3-3L4 16.5Z" /><path d="m14.5 6.5 3 3" /></BaseIcon>; }
export function DownloadIcon(props: IconProps) { return <BaseIcon {...props}><path d="M12 3v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M5 20h14" /></BaseIcon>; }
export function FilePdfIcon(props: IconProps) { return <BaseIcon {...props}><path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5" /><path d="M8 14h2.2a1.7 1.7 0 0 0 0-3.4H8v5.4" /><path d="M13 15.9v-5.3h1.3a2.65 2.65 0 0 1 0 5.3H13Z" /></BaseIcon>; }
export function PlusIcon(props: IconProps) { return <BaseIcon {...props}><path d="M12 5v14M5 12h14" /></BaseIcon>; }
export function ArrowLeftIcon(props: IconProps) { return <BaseIcon {...props}><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></BaseIcon>; }
export function CalendarIcon(props: IconProps) { return <BaseIcon {...props}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></BaseIcon>; }
export function UserIcon(props: IconProps) { return <BaseIcon {...props}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></BaseIcon>; }
export function FileTextIcon(props: IconProps) { return <BaseIcon {...props}><path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 13h8M8 17h6" /></BaseIcon>; }
export function CheckIcon(props: IconProps) { return <BaseIcon {...props}><path d="m5 12 4 4L19 6" /></BaseIcon>; }
export function SearchIcon(props: IconProps) { return <BaseIcon {...props}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></BaseIcon>; }
export function EyeIcon(props: IconProps) { return <BaseIcon {...props}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></BaseIcon>; }
export function XIcon(props: IconProps) { return <BaseIcon {...props}><path d="m6 6 12 12M18 6 6 18" /></BaseIcon>; }
