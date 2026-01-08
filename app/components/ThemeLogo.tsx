import Image from "next/image";

type Props = {
  className?: string;
  height?: number; 
};

export default function ThemeLogo({ className = "", height = 44 }: Props) {
  return (
    <div className={`mx-auto flex justify-center ${className}`}>
      <div className="block dark:hidden">
        <Image
          src="/backoffice-light.png"
          alt="Carsistem"
          width={220}
          height={height}
          priority
          className="h-30 w-auto object-contain"
        />
      </div>

      <div className="hidden dark:block">
        <Image
          src="/backoffice-dark.png"
          alt="Carsistem"
          width={220}
          height={height}
          priority
          className="h-30 w-auto object-contain"
        />
      </div>
    </div>
  );
}
