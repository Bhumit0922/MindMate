import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleCheckIcon } from "lucide-react";

const pricingCardVariants = cva(
  "rounded-2xl p-6 md:p-8 w-full transition-all duration-200 relative flex flex-col justify-between",
  {
    variants: {
      variant: {
        default:
          "bg-card text-card-foreground border border-border shadow-sm hover:shadow-md",
        highlighted:
          "bg-gradient-to-br from-[#093C23] via-[#0b2b1e] to-[#051B16] text-white border-2 border-primary/50 shadow-xl shadow-primary/10 ring-1 ring-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const pricingCardIconVariants = cva("size-4 shrink-0", {
  variants: {
    variant: {
      default: "text-primary",
      highlighted: "text-emerald-400",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const pricingCardSecondaryTextVariants = cva("text-muted-foreground", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      highlighted: "text-emerald-100/80",
    },
  },
});

const pricingCardBadgeVariants = cva("text-xs font-semibold px-2.5 py-0.5 rounded-full", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary",
      highlighted: "bg-emerald-400 text-emerald-950",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface Props extends VariantProps<typeof pricingCardVariants> {
  badge?: string | null;
  price: number;
  features: string[];
  title: string;
  description?: string | null;
  priceSuffix: string;
  className?: string;
  buttonText: string;
  disabled?: boolean;
  onClick: () => void;
}

export const PricingCard = ({
  variant,
  badge,
  price,
  features,
  title,
  description,
  priceSuffix,
  className,
  buttonText,
  disabled = false,
  onClick,
}: Props) => {
  return (
    <div className={cn(pricingCardVariants({ variant }), className)}>
      <div>
        <div className="flex items-start gap-x-4 justify-between">
          <div className="flex flex-col gap-y-1.5">
            <div className="flex items-center gap-x-2">
              <h3 className="font-semibold text-xl tracking-tight">{title}</h3>
              {badge ? (
                <Badge className={cn(pricingCardBadgeVariants({ variant }))}>
                  {badge}
                </Badge>
              ) : null}
            </div>
            {description && (
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  pricingCardSecondaryTextVariants({ variant })
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-baseline gap-x-1">
          <span className="text-4xl font-bold tracking-tight">
            {Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            }).format(price)}
          </span>
          <span
            className={cn(
              "text-sm font-medium",
              pricingCardSecondaryTextVariants({ variant })
            )}
          >
            {priceSuffix}
          </span>
        </div>

        <div className="my-6">
          <Separator
            className={cn(
              "opacity-20",
              variant === "highlighted" ? "bg-white/30" : "bg-border"
            )}
          />
        </div>

        <Button
          className={cn(
            "w-full h-11 font-medium transition-all",
            variant === "highlighted"
              ? "bg-emerald-400 text-emerald-950 hover:bg-emerald-300 font-semibold"
              : ""
          )}
          size="lg"
          disabled={disabled}
          variant={
            variant === "highlighted"
              ? "default"
              : disabled
              ? "outline"
              : "default"
          }
          onClick={onClick}
        >
          {buttonText}
        </Button>

        <div className="flex flex-col gap-y-3 mt-8">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              variant === "highlighted"
                ? "text-emerald-200/90"
                : "text-muted-foreground"
            )}
          >
            What&apos;s included
          </p>
          <ul className="flex flex-col gap-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-x-3 text-sm">
                <CircleCheckIcon
                  className={cn("mt-0.5", pricingCardIconVariants({ variant }))}
                />
                <span
                  className={cn(
                    "leading-normal",
                    pricingCardSecondaryTextVariants({ variant })
                  )}
                >
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
