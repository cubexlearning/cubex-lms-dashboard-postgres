"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  X,
  Users,
  DollarSign,
  Clock,
  Calendar,
  Image,
  Video,
  Tag,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

const basicInformationSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title must not exceed 50 characters")
    .refine(
      (val) => val.trim().length >= 3,
      "Title must be at least 3 characters",
    ),
  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(500, "Short description must not exceed 500 characters")
    .refine(
      (val) => val.trim().length >= 10,
      "Short description must be at least 10 characters",
    ),
  longDescription: z
    .string()
    .min(50, "Long description must be at least 50 characters")
    .max(5000, "Long description must not exceed 5000 characters")
    .refine(
      (val) => val.trim().length >= 50,
      "Long description must be at least 50 characters",
    ),
  categoryId: z.string().min(1, "Category is required"),
  curriculumId: z.string().min(1, "Curriculum is required"),
  courseFormatId: z.string().min(1, "Course format is required"),
});

const pricingSchema = z.object({
  // One-to-One Pricing with validation
  oneToOnePrice: z
    .number()
    .min(0, "Price cannot be negative")
    .max(10000000, "Price cannot exceed 10,000,000")
    .refine(
      (val) => Number.isFinite(val) && Math.floor(val * 100) === val * 100,
      { message: "Must have at most 2 decimal places" },
    )
    .optional()
    .or(z.nan())
    .or(z.null())
    .transform((val) =>
      val === null || isNaN(val as any) ? undefined : (val as number),
    ),
  oneToOneOffer: z
    .number()
    .min(0, "Offer price cannot be negative")
    .max(10000000, "Offer price cannot exceed 10,000,000")
    .refine(
      (val) => Number.isFinite(val) && Math.floor(val * 100) === val * 100,
      { message: "Must have at most 2 decimal places" },
    )
    .optional()
    .or(z.nan())
    .or(z.null())
    .transform((val) =>
      val === null || isNaN(val as any) ? undefined : (val as number),
    ),
  oneToOneActive: z.boolean().default(true),

  // Group Pricing with validation
  groupPrice: z
    .number()
    .min(0, "Group price cannot be negative")
    .max(10000000, "Group price cannot exceed 10,000,000")
    .refine(
      (val) => Number.isFinite(val) && Math.floor(val * 100) === val * 100,
      { message: "Must have at most 2 decimal places" },
    )
    .optional()
    .or(z.nan())
    .or(z.null())
    .transform((val) =>
      val === null || isNaN(val as any) ? undefined : (val as number),
    ),
  groupOffer: z
    .number()
    .min(0, "Group offer price cannot be negative")
    .max(10000000, "Group offer price cannot exceed 10,000,000")
    .refine(
      (val) => Number.isFinite(val) && Math.floor(val * 100) === val * 100,
      { message: "Must have at most 2 decimal places" },
    )
    .optional()
    .or(z.nan())
    .or(z.null())
    .transform((val) =>
      val === null || isNaN(val as any) ? undefined : (val as number),
    ),
  groupActive: z.boolean().default(true),
  maxGroupSize: z
    .number()
    .int("Group size must be a whole number")
    .min(1, "Maximum group size must be at least 1")
    .max(100, "Maximum group size cannot exceed 100")
    .optional()
    .or(z.nan())
    .or(z.null())
    .transform((val) =>
      val === null || isNaN(val as any) ? undefined : (val as number),
    ),
  minGroupSize: z
    .number()
    .int("Group size must be a whole number")
    .min(1, "Minimum group size must be at least 1")
    .max(100, "Minimum group size cannot exceed 100")
    .optional()
    .or(z.nan())
    .or(z.null())
    .transform((val) =>
      val === null || isNaN(val as any) ? undefined : (val as number),
    ),
});

const sessionDetailsSchema = z.object({
  sessionDuration: z
    .number()
    .int("Session duration must be a whole number")
    .min(15, "Session duration must be at least 15 minutes")
    .max(480, "Session duration cannot exceed 480 minutes (8 hours)")
    .optional()
    .or(z.nan())
    .or(z.null())
    .transform((val) =>
      val === null || isNaN(val as any) ? undefined : (val as number),
    ),
  sessionsPerWeek: z
    .number()
    .int("Sessions per week must be a whole number")
    .min(1, "Must have at least 1 session per week")
    .max(7, "Cannot exceed 7 sessions per week")
    .optional()
    .or(z.nan())
    .or(z.null())
    .transform((val) =>
      val === null || isNaN(val as any) ? undefined : (val as number),
    ),
  totalSessions: z
    .number()
    .int("Total sessions must be a whole number")
    .min(1, "Must have at least 1 session")
    .max(1000, "Cannot exceed 1000 sessions")
    .optional()
    .or(z.nan())
    .or(z.null())
    .transform((val) =>
      val === null || isNaN(val as any) ? undefined : (val as number),
    ),
});

const requirementsSchema = z.object({
  minAge: z
    .number()
    .int("Age must be a whole number")
    .min(3, "Minimum age must be at least 3")
    .max(100, "Minimum age cannot exceed 100")
    .optional()
    .or(z.nan())
    .or(z.null())
    .transform((val) =>
      val === null || isNaN(val as any) ? undefined : (val as number),
    ),
  maxAge: z
    .number()
    .int("Age must be a whole number")
    .min(3, "Maximum age must be at least 3")
    .max(100, "Maximum age cannot exceed 100")
    .optional()
    .or(z.nan())
    .or(z.null())
    .transform((val) =>
      val === null || isNaN(val as any) ? undefined : (val as number),
    ),
  prerequisiteLevel: z
    .string()
    .max(100, "Prerequisite level must not exceed 100 characters")
    .optional(),
});

const tutorsStatusSchema = z.object({
  courseTypeId: z.string().min(1, "Course type is required"),
  tutorIds: z.array(z.string()).default([]),
  primaryTutorId: z.string().optional(),
  status: z
    .enum(["DRAFT", "PUBLISHED", "ARCHIVED", "SUSPENDED"])
    .default("DRAFT"),
});

const mediaTagsSchema = z.object({
  primaryImage: z
    .string()
    .max(2000, "URL too long")
    .optional()
    .or(z.literal("")),
  secondaryImage: z
    .string()
    .max(2000, "URL too long")
    .optional()
    .or(z.literal("")),
  videoUrl: z.string().max(2000, "URL too long").optional().or(z.literal("")),
  tags: z
    .array(z.string().min(1).max(50))
    .max(20, "Cannot exceed 20 tags")
    .default([]),
  difficulty: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
      invalid_type_error: "Please select a valid difficulty level",
    })
    .optional(),
});

const courseFormSchema = basicInformationSchema
  .merge(pricingSchema)
  .merge(sessionDetailsSchema)
  .merge(requirementsSchema)
  .merge(tutorsStatusSchema)
  .merge(mediaTagsSchema)
  .refine(
    (data) => {
      // Validate that maxAge >= minAge if both are provided
      if (data.minAge && data.maxAge && data.maxAge < data.minAge) {
        return false;
      }
      return true;
    },
    {
      message: "Maximum age must be greater than or equal to minimum age",
      path: ["maxAge"],
    },
  )
  .refine(
    (data) => {
      // Validate that maxGroupSize >= minGroupSize if both are provided
      if (
        data.minGroupSize &&
        data.maxGroupSize &&
        data.maxGroupSize < data.minGroupSize
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Maximum group size must be greater than or equal to minimum group size",
      path: ["maxGroupSize"],
    },
  )
  .refine(
    (data) => {
      // Validate that offer price <= regular price if both are provided
      if (
        data.oneToOnePrice &&
        data.oneToOneOffer &&
        data.oneToOneOffer > data.oneToOnePrice
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Offer price cannot be greater than regular price",
      path: ["oneToOneOffer"],
    },
  )
  .refine(
    (data) => {
      // Validate that group offer price <= group regular price if both are provided
      if (
        data.groupPrice &&
        data.groupOffer &&
        data.groupOffer > data.groupPrice
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Group offer price cannot be greater than regular price",
      path: ["groupOffer"],
    },
  );

type CourseFormData = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  initialData?: Partial<CourseFormData>;
  onSubmit: (data: CourseFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Step definitions
const STEPS = [
  {
    id: 1,
    title: "Basic Information",
    description: "Course details and description",
  },
  { id: 2, title: "Pricing", description: "One-to-one and group pricing" },
  { id: 3, title: "Session Details", description: "Duration and scheduling" },
  { id: 4, title: "Requirements", description: "Age and prerequisites" },
  {
    id: 5,
    title: "Tutors & Status",
    description: "Assign tutors and set status",
  },
  { id: 6, title: "Media & Tags", description: "Images, videos and tags" },
];

export function CourseForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: CourseFormProps) {
  const [loading, setLoading] = useState(false);
  const { getCurrencySymbol, loading:getCurrencySymbolLoading } = useSettings();
  const currencySymbol = getCurrencySymbol();
  const isEdit = Boolean((initialData as any)?.id);
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [curricula, setCurricula] = useState<any[]>([]);
  const [courseFormats, setCourseFormats] = useState<any[]>([]);
  const [courseTypes, setCourseTypes] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [selectedTutors, setSelectedTutors] = useState<string[]>(
    initialData?.tutorIds || [],
  );
  const [newTag, setNewTag] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue: _setValue,
    setError,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    mode: "onChange",
    defaultValues: {
      title: initialData?.title || "",
      shortDescription: initialData?.shortDescription || "",
      longDescription: initialData?.longDescription || "",
      categoryId: initialData?.categoryId || "",
      curriculumId: initialData?.curriculumId || "",
      courseFormatId: initialData?.courseFormatId || "",
      courseTypeId: initialData?.courseTypeId || "",
      oneToOneActive: initialData?.oneToOneActive ?? true,
      groupActive: initialData?.groupActive ?? true,
      tags: initialData?.tags || [],
      tutorIds: initialData?.tutorIds || [],
      status: initialData?.status || "DRAFT",
      difficulty: initialData?.difficulty || undefined,
      prerequisiteLevel: initialData?.prerequisiteLevel || "",
      primaryImage: initialData?.primaryImage || "",
      secondaryImage: initialData?.secondaryImage || "",
      videoUrl: initialData?.videoUrl || "",
      primaryTutorId: initialData?.primaryTutorId,
    },
  });

  const setValue = (
    key: Parameters<typeof _setValue>[0],
    value: Parameters<typeof _setValue>[1],
    options?: Parameters<typeof _setValue>[2],
  ) => {
    _setValue(key, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  useEffect(() => {
    // Normalize and populate initial values for edit mode
    if (initialData) {
      setLoading(true);
      if (initialData.title) setValue("title", initialData.title);
      if (initialData.shortDescription)
        _setValue("shortDescription", initialData.shortDescription);
      if (initialData.longDescription)
        _setValue("longDescription", initialData.longDescription);
      if (initialData.categoryId)
        _setValue("categoryId", initialData.categoryId);
      if (initialData.curriculumId)
        _setValue("curriculumId", initialData.curriculumId);
      if (initialData.courseFormatId)
        _setValue("courseFormatId", initialData.courseFormatId);
      if (initialData.courseTypeId)
        _setValue("courseTypeId", initialData.courseTypeId);
      if (initialData.status) setValue("status", initialData.status as any);
      if (initialData.difficulty) {
        // Ensure diDifficulty Levelformatting
        _setValue(
          "difficulty",
          (initialData.difficulty as any).toString().toUpperCase() as any,
        );
      }
      // Numeric fields
      if (typeof (initialData as any).oneToOnePrice !== "undefined")
        _setValue("oneToOnePrice", (initialData as any).oneToOnePrice as any);
      if (typeof (initialData as any).oneToOneOffer !== "undefined")
        _setValue("oneToOneOffer", (initialData as any).oneToOneOffer as any);
      if (typeof (initialData as any).oneToOneActive !== "undefined")
        _setValue("oneToOneActive", (initialData as any).oneToOneActive as any);
      if (typeof (initialData as any).groupPrice !== "undefined")
        _setValue("groupPrice", (initialData as any).groupPrice as any);
      if (typeof (initialData as any).groupOffer !== "undefined")
        _setValue("groupOffer", (initialData as any).groupOffer as any);
      if (typeof (initialData as any).groupActive !== "undefined")
        _setValue("groupActive", (initialData as any).groupActive as any);
      if (typeof (initialData as any).maxGroupSize !== "undefined")
        _setValue("maxGroupSize", (initialData as any).maxGroupSize as any);
      if (typeof (initialData as any).minGroupSize !== "undefined")
        _setValue("minGroupSize", (initialData as any).minGroupSize as any);
      if (typeof (initialData as any).sessionDuration !== "undefined")
        _setValue(
          "sessionDuration",
          (initialData as any).sessionDuration as any,
        );
      if (typeof (initialData as any).sessionsPerWeek !== "undefined")
        _setValue(
          "sessionsPerWeek",
          (initialData as any).sessionsPerWeek as any,
        );
      if (typeof (initialData as any).totalSessions !== "undefined")
        _setValue("totalSessions", (initialData as any).totalSessions as any);
      if ((initialData as any).tags)
        _setValue("tags", (initialData as any).tags as any);
      if ((initialData as any).primaryTutorId)
        _setValue("primaryTutorId", (initialData as any).primaryTutorId as any);
    }

    const loadData = async () => {
      try {
        // Load categories
        const categoriesResponse = await fetch("/api/categories");
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }

        // Load curricula
        const curriculaResponse = await fetch("/api/curriculum");
        const curriculaData = await curriculaResponse.json();
        if (curriculaData.success) {
          setCurricula(curriculaData.data);
        }

        // Load tutors
        const tutorsResponse = await fetch("/api/users?role=TUTOR");
        const tutorsData = await tutorsResponse.json();
        if (tutorsData.success) {
          setTutors(tutorsData.data);
        }

        // Load course formats
        const formatsResponse = await fetch("/api/course-formats");
        const formatsData = await formatsResponse.json();
        if (formatsData.success) {
          setCourseFormats(formatsData.data);
        }

        // Load course types
        const typesResponse = await fetch("/api/course-types");
        const typesData = await typesResponse.json();
        if (typesData.success) {
          setCourseTypes(typesData.data);
        }
      } catch (error) {
        console.error("Error loading form data:", error);
        toast.error("Failed to load form data");
      }
    };

    loadData().finally(() => setLoading(false));
  }, []);

  const handleTutorSelection = (tutorId: string, checked: boolean) => {
    if (checked) {
      setSelectedTutors([...selectedTutors, tutorId]);
      setValue("tutorIds", [...selectedTutors, tutorId]);
    } else {
      const updated = selectedTutors.filter((id) => id !== tutorId);
      setSelectedTutors(updated);
      setValue("tutorIds", updated);
    }
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    const currentTags = watch("tags");

    if (!trimmedTag) {
      toast.error("Tag cannot be empty");
      return;
    }

    if (trimmedTag.length > 50) {
      toast.error("Tag must not exceed 50 characters");
      return;
    }

    if (currentTags.length >= 20) {
      toast.error("Cannot exceed 20 tags");
      return;
    }

    if (currentTags.includes(trimmedTag)) {
      toast.error("Tag already exists");
      return;
    }

    setValue("tags", [...currentTags, trimmedTag]);
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = watch("tags");
    setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove),
    );
  };

  // Step validation functions
  const validateStep = (step: number): boolean => {
    const formData = watch();

    switch (step) {
      case 1: {
        // Basic Information
        const { success, error } = basicInformationSchema.safeParse(formData);
        if (success) return true;

        error.issues.forEach((issue) => {
          const fieldName = issue.path.join(".") as keyof CourseFormData;
          setError(fieldName, {
            type: "manual",
            message: issue.message,
          });
        });
        return false;
      }

      case 2: {
        // Pricing
        const { success, error } = pricingSchema
          .refine(
            (data) => {
              // Validate that maxGroupSize >= minGroupSize if both are provided
              if (
                data.minGroupSize &&
                data.maxGroupSize &&
                data.maxGroupSize < data.minGroupSize
              ) {
                return false;
              }
              return true;
            },
            {
              message:
                "Maximum group size must be greater than or equal to minimum group size",
              path: ["maxGroupSize"],
            },
          )
          .refine(
            (data) => {
              // Validate that offer price <= regular price if both are provided
              if (
                data.oneToOnePrice &&
                data.oneToOneOffer &&
                data.oneToOneOffer > data.oneToOnePrice
              ) {
                return false;
              }
              return true;
            },
            {
              message: "Offer price cannot be greater than regular price",
              path: ["oneToOneOffer"],
            },
          )
          .refine(
            (data) => {
              // Validate that group offer price <= group regular price if both are provided
              if (
                data.groupPrice &&
                data.groupOffer &&
                data.groupOffer > data.groupPrice
              ) {
                return false;
              }
              return true;
            },
            {
              message: "Group offer price cannot be greater than regular price",
              path: ["groupOffer"],
            },
          )
          .safeParse(formData);
        if (success) return true;

        error.issues.forEach((issue) => {
          const fieldName = issue.path.join(".") as keyof CourseFormData;
          setError(fieldName, {
            type: "manual",
            message: issue.message,
          });
        });
        return false;
      }

      case 3: {
        const { success, error } = sessionDetailsSchema.safeParse(formData);
        if (success) return true;
        error.issues.forEach((issue) => {
          const fieldName = issue.path.join(".") as keyof CourseFormData;
          setError(fieldName, {
            type: "manual",
            message: issue.message,
          });
        });
        return false;
      }

      case 4: {
        const { success, error } = requirementsSchema
          .refine(
            (data) => {
              // Validate that maxAge >= minAge if both are provided
              if (data.minAge && data.maxAge && data.maxAge < data.minAge) {
                return false;
              }
              return true;
            },
            {
              message:
                "Maximum age must be greater than or equal to minimum age",
              path: ["maxAge"],
            },
          )
          .safeParse(formData);
        if (success) return true;
        error.issues.forEach((issue) => {
          const fieldName = issue.path.join(".") as keyof CourseFormData;
          setError(fieldName, {
            type: "manual",
            message: issue.message,
          });
        });
        return false;
      }

      case 5: {
        const { success, error } = tutorsStatusSchema.safeParse(formData);
        if (success) return true;
        error.issues.forEach((issue) => {
          const fieldName = issue.path.join(".") as keyof CourseFormData;
          setError(fieldName, {
            type: "manual",
            message: issue.message,
          });
        });
        return false;
      }

      case 6: {
        const { success, error } = mediaTagsSchema.safeParse(formData);
        if (success) return true;
        error.issues.forEach((issue) => {
          const fieldName = issue.path.join(".") as keyof CourseFormData;
          setError(fieldName, {
            type: "manual",
            message: issue.message,
          });
        });
        return false;
      }

      default:
        return true;
    }
  };

  const nextStep = (e?: React.MouseEvent) => {
    e?.preventDefault(); // Prevent form submission
    setShowValidation(true);

    if (validateStep(currentStep) || isEdit) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
        setShowValidation(false); // Reset validation state for next step
      }
    }
  };

  const prevStep = (e?: React.MouseEvent) => {
    e?.preventDefault(); // Prevent form submission
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onFormSubmit = async (data: CourseFormData) => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form data received:", data);
    console.log("Form errors:", errors);
    console.log("Selected tutors:", selectedTutors);

    try {
      // Enforce minimal required fields only on create
      if (!isEdit) {
        if (!data.title || !data.title.trim()) {
          toast.error("Title is required");
          return;
        }
        if (!data.shortDescription || !data.shortDescription.trim()) {
          toast.error("Short description is required");
          return;
        }
        if (!data.categoryId || !data.categoryId.trim()) {
          toast.error("Category is required");
          return;
        }
      }

      // Ensure tutorIds is properly set
      const formData = {
        ...data,
        tutorIds: selectedTutors,
      };

      console.log("Final data being sent:", formData);
      await onSubmit(formData);
      console.log("onSubmit completed successfully");
    } catch (error: any) {
      console.error("=== FORM SUBMISSION ERROR ===");
      console.error("Error:", error);
      // Re-throw the error so the parent component can handle it
      throw error;
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-gray-600">
          Step {currentStep} of {STEPS.length}:
        </span>
        <span className="font-medium text-gray-900">
          {STEPS[currentStep - 1]?.title}
        </span>
      </div>
    </div>
  );

  if(loading || getCurrencySymbolLoading){
    return "Loading..."
  }

  return (
    <div className="space-y-6">
      <StepIndicator />

      <form
        onSubmit={handleSubmit(
          (data) => {
            // Only submit if we're on the final step
            if (currentStep === STEPS.length) {
              console.log("✅ handleSubmit called with data:", data);
              onFormSubmit(data);
            } else {
              console.log("Form submission prevented - not on final step");
            }
          },
          (errors: any) => {
            console.log("❌ Form validation failed with errors:", errors);
            setShowValidation(true);
            // Show concise, user-friendly error
            toast.error("Please review the highlighted fields");
          },
        )}
        className="space-y-6"
      >
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Enter course title"
                    className={errors.title ? "border-red-500" : ""}
                    required
                    minLength={3}
                    maxLength={50}
                  />
                  {showValidation && errors.title && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select
                    value={watch("categoryId")}
                    onValueChange={(value) => setValue("categoryId", value)}
                  >
                    <SelectTrigger
                      className={errors.categoryId ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned" sideOffset={5}>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidation && errors.categoryId && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="curriculumId">Curriculum *</Label>
                  <Select
                    value={watch("curriculumId")}
                    onValueChange={(value) => setValue("curriculumId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select curriculum" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned" sideOffset={5}>
                      {curricula.map((curriculum) => (
                        <SelectItem key={curriculum.id} value={curriculum.id}>
                          {curriculum.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidation && errors.curriculumId && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.curriculumId.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="courseFormatId">Course Format *</Label>
                  <Select
                    value={watch("courseFormatId")}
                    onValueChange={(value) => setValue("courseFormatId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned" sideOffset={5}>
                      {courseFormats.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidation && errors.courseFormatId && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.courseFormatId.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description *</Label>
                <Textarea
                  id="shortDescription"
                  {...register("shortDescription")}
                  placeholder="Brief description of the course"
                  className={errors.shortDescription ? "border-red-500" : ""}
                  rows={3}
                  required
                  minLength={10}
                  maxLength={500}
                />
                {showValidation && errors.shortDescription && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.shortDescription.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="longDescription">Long Description *</Label>
                <Textarea
                  id="longDescription"
                  {...register("longDescription")}
                  placeholder="Detailed description of the course"
                  rows={4}
                  required
                  minLength={50}
                  maxLength={5000}
                />
                {showValidation && errors.longDescription && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.longDescription.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Pricing */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* One-to-One Pricing */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <h4 className="font-medium">One-to-One Pricing</h4>
                  <Switch
                    checked={watch("oneToOneActive")}
                    onCheckedChange={(checked) =>
                      setValue("oneToOneActive", checked)
                    }
                  />
                </div>

                {watch("oneToOneActive") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="oneToOnePrice">
                        Price per Session ({currencySymbol})
                      </Label>
                      <Input
                        id="oneToOnePrice"
                        type="number"
                        {...register("oneToOnePrice", {
                          valueAsNumber: true,
                          setValueAs: (value) =>
                            isNaN(value) ? undefined : value,
                        })}
                        placeholder="0.00"
                        className={errors.oneToOnePrice ? "border-red-500" : ""}
                        min={0}
                        max={10000000}
                        step="0.01"
                      />
                      {showValidation && errors.oneToOnePrice && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.oneToOnePrice.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="oneToOneOffer">
                        Offer Price ({currencySymbol})
                      </Label>
                      <Input
                        id="oneToOneOffer"
                        type="number"
                        {...register("oneToOneOffer", {
                          valueAsNumber: true,
                          setValueAs: (value) =>
                            isNaN(value) ? undefined : value,
                        })}
                        placeholder="0.00"
                        className={errors.oneToOneOffer ? "border-red-500" : ""}
                        min={0}
                        max={10000000}
                        step="0.01"
                      />
                      {showValidation && errors.oneToOneOffer && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.oneToOneOffer.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Group Pricing */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <h4 className="font-medium">Group Pricing</h4>
                  <Switch
                    checked={watch("groupActive")}
                    onCheckedChange={(checked) =>
                      setValue("groupActive", checked)
                    }
                  />
                </div>

                {watch("groupActive") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="groupPrice">
                        Price per Session ({currencySymbol})
                      </Label>
                      <Input
                        id="groupPrice"
                        type="number"
                        {...register("groupPrice", {
                          valueAsNumber: true,
                          setValueAs: (value) =>
                            isNaN(value) ? undefined : value,
                        })}
                        placeholder="0.00"
                        className={errors.groupPrice ? "border-red-500" : ""}
                        min={0}
                        max={10000000}
                        step="0.01"
                      />
                      {showValidation && errors.groupPrice && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.groupPrice.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="groupOffer">
                        Offer Price ({currencySymbol})
                      </Label>
                      <Input
                        id="groupOffer"
                        type="number"
                        {...register("groupOffer", {
                          valueAsNumber: true,
                          setValueAs: (value) =>
                            isNaN(value) ? undefined : value,
                        })}
                        placeholder="0.00"
                        className={errors.groupOffer ? "border-red-500" : ""}
                        min={0}
                        max={10000000}
                        step="0.01"
                      />
                      {showValidation && errors.groupOffer && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.groupOffer.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {watch("groupActive") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minGroupSize">Minimum Group Size</Label>
                      <Input
                        id="minGroupSize"
                        type="number"
                        {...register("minGroupSize", {
                          valueAsNumber: true,
                          setValueAs: (value) =>
                            isNaN(value) ? undefined : value,
                        })}
                        placeholder="2"
                        className={errors.minGroupSize ? "border-red-500" : ""}
                        min={1}
                        max={100}
                        step={1}
                      />
                      {showValidation && errors.minGroupSize && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.minGroupSize.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="maxGroupSize">Maximum Group Size</Label>
                      <Input
                        id="maxGroupSize"
                        type="number"
                        {...register("maxGroupSize", {
                          valueAsNumber: true,
                          setValueAs: (value) =>
                            isNaN(value) ? undefined : value,
                        })}
                        placeholder="10"
                        className={errors.maxGroupSize ? "border-red-500" : ""}
                        min={1}
                        max={100}
                        step={1}
                      />
                      {showValidation && errors.maxGroupSize && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.maxGroupSize.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Session Details */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sessionDuration">
                    Session Duration (minutes)
                  </Label>
                  <Input
                    id="sessionDuration"
                    type="number"
                    {...register("sessionDuration", {
                      valueAsNumber: true,
                      setValueAs: (value) => (isNaN(value) ? undefined : value),
                    })}
                    placeholder="60"
                    className={errors.sessionDuration ? "border-red-500" : ""}
                    min={15}
                    max={480}
                    step={5}
                  />
                  {showValidation && errors.sessionDuration && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.sessionDuration.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="sessionsPerWeek">Sessions per Week</Label>
                  <Input
                    id="sessionsPerWeek"
                    type="number"
                    {...register("sessionsPerWeek", {
                      valueAsNumber: true,
                      setValueAs: (value) => (isNaN(value) ? undefined : value),
                    })}
                    placeholder="2"
                    className={errors.sessionsPerWeek ? "border-red-500" : ""}
                    min={1}
                    max={7}
                    step={1}
                  />
                  {showValidation && errors.sessionsPerWeek && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.sessionsPerWeek.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="totalSessions">Total Sessions</Label>
                  <Input
                    id="totalSessions"
                    type="number"
                    {...register("totalSessions", {
                      valueAsNumber: true,
                      setValueAs: (value) => (isNaN(value) ? undefined : value),
                    })}
                    placeholder="20"
                    className={errors.totalSessions ? "border-red-500" : ""}
                    min={1}
                    max={1000}
                    step={1}
                  />
                  {showValidation && errors.totalSessions && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.totalSessions.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Requirements */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Age Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="minAge">Minimum Age</Label>
                  <Input
                    id="minAge"
                    type="number"
                    {...register("minAge", {
                      valueAsNumber: true,
                      setValueAs: (value) => (isNaN(value) ? undefined : value),
                    })}
                    placeholder="10"
                    className={errors.minAge ? "border-red-500" : ""}
                    min={3}
                    max={100}
                    step={1}
                  />
                  {showValidation && errors.minAge && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.minAge.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="maxAge">Maximum Age</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    {...register("maxAge", {
                      valueAsNumber: true,
                      setValueAs: (value) => (isNaN(value) ? undefined : value),
                    })}
                    placeholder="18"
                    className={errors.maxAge ? "border-red-500" : ""}
                    min={3}
                    max={100}
                    step={1}
                  />
                  {showValidation && errors.maxAge && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.maxAge.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="prerequisiteLevel">Prerequisite Level</Label>
                  <Input
                    id="prerequisiteLevel"
                    {...register("prerequisiteLevel")}
                    placeholder="National 5"
                    className={errors.prerequisiteLevel ? "border-red-500" : ""}
                    maxLength={100}
                  />
                  {showValidation && errors.prerequisiteLevel && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.prerequisiteLevel.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Tutors & Status */}
        {currentStep === 5 && (
          <>
            {/* Course Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Course Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="courseTypeId">Course Type *</Label>
                  <Select
                    value={watch("courseTypeId")}
                    onValueChange={(value) => setValue("courseTypeId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course type" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned" sideOffset={5}>
                      {courseTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidation && errors.courseTypeId && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.courseTypeId.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tutor Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Tutor Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Tutors (Optional)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {tutors.map((tutor) => (
                      <div
                        key={tutor.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`tutor-${tutor.id}`}
                          checked={selectedTutors.includes(tutor.id)}
                          onCheckedChange={(checked) =>
                            handleTutorSelection(tutor.id, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`tutor-${tutor.id}`}
                          className="text-sm"
                        >
                          {tutor.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {showValidation && errors.tutorIds && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.tutorIds.message}
                    </p>
                  )}
                </div>

                {selectedTutors.length > 0 && (
                  <div>
                    <Label htmlFor="primaryTutorId">Primary Tutor</Label>
                    <Select
                      value={watch("primaryTutorId")}
                      onValueChange={(value) =>
                        setValue("primaryTutorId", value)
                      }
                    >
                      <SelectTrigger
                        className={
                          errors.primaryTutorId ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Select primary tutor" />
                      </SelectTrigger>
                      <SelectContent position="item-aligned" sideOffset={5}>
                        {selectedTutors.map((tutorId) => {
                          const tutor = tutors.find((t) => t.id === tutorId);
                          return tutor ? (
                            <SelectItem key={tutorId} value={tutorId}>
                              {tutor.name}
                            </SelectItem>
                          ) : null;
                        })}
                      </SelectContent>
                    </Select>
                    {showValidation && errors.primaryTutorId && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.primaryTutorId.message}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Course Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch("status")}
                    onValueChange={(value) =>
                      setValue(
                        "status",
                        value as "DRAFT" | "PUBLISHED" | "ARCHIVED",
                      )
                    }
                  >
                    <SelectTrigger
                      className={errors.status ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned" sideOffset={5}>
                      <SelectItem value="DRAFT">
                        Draft (Not Published)
                      </SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {showValidation && errors.status && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.status.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 6: Media & Tags */}
        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Media & Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryImage">Primary Image URL</Label>
                  <Input
                    id="primaryImage"
                    {...register("primaryImage")}
                    placeholder="https://example.com/image.jpg"
                    className={errors.primaryImage ? "border-red-500" : ""}
                    type="url"
                    maxLength={2000}
                  />
                  {showValidation && errors.primaryImage && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.primaryImage.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="secondaryImage">Secondary Image URL</Label>
                  <Input
                    id="secondaryImage"
                    {...register("secondaryImage")}
                    placeholder="https://example.com/image2.jpg"
                    className={errors.secondaryImage ? "border-red-500" : ""}
                    type="url"
                    maxLength={2000}
                  />
                  {showValidation && errors.secondaryImage && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.secondaryImage.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  {...register("videoUrl")}
                  placeholder="https://youtube.com/watch?v=..."
                  className={errors.videoUrl ? "border-red-500" : ""}
                  type="url"
                  maxLength={2000}
                />
                {showValidation && errors.videoUrl && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.videoUrl.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={watch("difficulty") || ""}
                  onValueChange={(value) => {
                    if (value) {
                      setValue(
                        "difficulty",
                        value as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
                      );
                    }
                  }}
                >
                  <SelectTrigger
                    className={errors.difficulty ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select difficulty level" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned" sideOffset={5}>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                {showValidation && errors.difficulty && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.difficulty.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    maxLength={50}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {watch("tags").map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {showValidation && errors.tags && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.tags.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Navigation */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                onCancel();
              }}
            >
              Cancel
            </Button>
          </div>

          <div className="flex gap-3">
            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Course"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}