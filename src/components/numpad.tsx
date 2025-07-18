import { Button } from '@/components/ui/button';

interface NumpadProps {
  onKeyPress: (key: string) => void;
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'];

export function Numpad({ onKeyPress }: NumpadProps) {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {keys.map(key => (
        <Button
          key={key}
          variant="outline"
          className="h-16 md:h-20 text-2xl md:text-3xl font-semibold"
          onClick={() => onKeyPress(key)}
        >
          {key}
        </Button>
      ))}
    </div>
  );
}
