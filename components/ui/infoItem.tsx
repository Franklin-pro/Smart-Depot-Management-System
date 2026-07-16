import { cn } from "@/lib/utils";

const InfoItem = ({ 
  label, 
  value, 
  capitalize = false,
  className = "" 
}: { 
  label: string; 
  value: any; 
  capitalize?: boolean;
  className?: string;
}) => (
  <div className={className}>
    <span className="text-muted-foreground">{label}: </span>
    <span className={cn("font-medium", capitalize && "capitalize")}>
      {value || "-"}
    </span>
  </div>
);
export default InfoItem