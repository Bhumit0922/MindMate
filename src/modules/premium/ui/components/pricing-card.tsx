import {cva, type VariantProps} from "class-variance-authority"

const pricingCardVariants = cva("rounded-lg p-4 py-6 w-full", {
    variants: {
        variant: {
            default: "bg-white text-black",
            highlighted: "bg-lighter-to-br from-[#093C23] to-[#051B16] text-white",
        }
    },
    defaultVariants: {
        variant: "default"
    }
})

const pricingCardIconVariants = cva("size-5", {
    variants: {
        variant: {
            default: "fill-primary text-white",
            highlighted: "fill-white text-black",
        }
    },
    defaultVariants: {
        variant: "default"
    }
})

const pricingCardSecondaryTextVariants = cva("text-neutral-700", {
    variants: {
        variant: {
            default: "text-neutral-700",
            highlighted: "text-neutral-300",
        }
    },
    
})

const pricingCardBadgeVariants = cva("text-black text-xs font-normal p-1", {
    variants: {
        variant: {
            default: "bg-primary/20",
            highlighted: "bg-[#F5B797]",
        }
    },
    defaultVariants: {
        variant: "default"
    }
})

interface Props extends VariantProps<typeof pricingCardVariants> {
    badge?: string | null;
    price: number;
    features: string;
    title: string;
    description?: string | null;
    priceSuffix: string;
    className?: string;
    buttonText: string;
    onClick: () => void
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
    onClick,
}: Props) => {
    return(
        <div className={cn(pricingCardVariants({variant}), className, "border")}>
            <div className="flex items-end gap-x-4 justify-between"></div>
        </div>
    )
}