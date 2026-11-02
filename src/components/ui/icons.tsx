"use client";

import {
  MorphIcon,
  type MorphIconProps,
  type IconInput,
} from "morphicons/react";
import type { ComponentType } from "react";
import {
  ArrowLeft as ArrowLeftData,
  ArrowRight as ArrowRightData,
  BadgeCheck as BadgeCheckData,
  Bold as BoldData,
  BookCheck as BookCheckData,
  BookOpenText as BookOpenTextData,
  Bookmark as BookmarkData,
  BrainCircuit as BrainCircuitData,
  CalendarDays as CalendarDaysData,
  Check as CheckData,
  CheckCircle2 as CheckCircle2Data,
  ChevronDown as ChevronDownData,
  ChevronLeft as ChevronLeftData,
  ChevronRight as ChevronRightData,
  Circle as CircleData,
  CircleCheck as CircleCheckData,
  CircleHelp as CircleHelpData,
  Clock3 as Clock3Data,
  Code2 as Code2Data,
  Copy as CopyData,
  Crown as CrownData,
  DoorOpen as DoorOpenData,
  Download as DownloadData,
  Eraser as EraserData,
  Eye as EyeData,
  FileText as FileTextData,
  GitCompareArrows as GitCompareArrowsData,
  Globe2 as Globe2Data,
  Hand as HandData,
  Heading2 as Heading2Data,
  HelpCircle as HelpCircleData,
  Highlighter as HighlighterData,
  History as HistoryData,
  House as HouseData,
  ImagePlus as ImagePlusData,
  Italic as ItalicData,
  KeyRound as KeyRoundData,
  Layers3 as Layers3Data,
  LibraryBig as LibraryBigData,
  List as ListData,
  ListOrdered as ListOrderedData,
  LockKeyhole as LockKeyholeData,
  LogOut as LogOutData,
  Mail as MailData,
  Maximize2 as Maximize2Data,
  MessageCircleQuestion as MessageCircleQuestionData,
  MessageSquare as MessageSquareData,
  Minus as MinusData,
  MoreHorizontal as MoreHorizontalData,
  MousePointer2 as MousePointer2Data,
  PanelLeft as PanelLeftData,
  PanelRightClose as PanelRightCloseData,
  PanelsTopLeft as PanelsTopLeftData,
  PenTool as PenToolData,
  Pencil as PencilData,
  Plus as PlusData,
  Presentation as PresentationData,
  Quote as QuoteData,
  Radio as RadioData,
  Redo2 as Redo2Data,
  RefreshCw as RefreshCwData,
  RemoveFormatting as RemoveFormattingData,
  RotateCcw as RotateCcwData,
  Route as RouteData,
  Save as SaveData,
  SendHorizontal as SendHorizontalData,
  Settings as SettingsData,
  Settings2 as Settings2Data,
  ShieldAlert as ShieldAlertData,
  ShieldCheck as ShieldCheckData,
  Sparkles as SparklesData,
  Split as SplitData,
  Square as SquareData,
  StickyNote as StickyNoteData,
  Strikethrough as StrikethroughData,
  Trash2 as Trash2Data,
  TriangleAlert as TriangleAlertData,
  Type as TypeData,
  Undo2 as Undo2Data,
  Upload as UploadData,
  UserMinus as UserMinusData,
  UserPlus as UserPlusData,
  UserRound as UserRoundData,
  UsersRound as UsersRoundData,
  X as XData,
  ZoomIn as ZoomInData,
  ZoomOut as ZoomOutData,
} from "lucide";

export type IconProps = Omit<
  MorphIconProps,
  "icon" | "from" | "to" | "progress"
>;
export type IconComponent = ComponentType<IconProps>;

export function AppIcon({
  iconData,
  ...props
}: IconProps & { iconData: IconInput }): React.ReactElement {
  return (
    <MorphIcon
      spring="snappy"
      reducedMotion="user"
      {...props}
      icon={iconData}
    />
  );
}

export function ArrowLeft(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ArrowLeftData} />;
}

export function ArrowRight(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ArrowRightData} />;
}

export function BadgeCheck(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={BadgeCheckData} />;
}

export function Bold(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={BoldData} />;
}

export function BookCheck(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={BookCheckData} />;
}

export function BookOpenText(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={BookOpenTextData} />;
}

export function Bookmark(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={BookmarkData} />;
}

export function BrainCircuit(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={BrainCircuitData} />;
}

export function CalendarDays(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={CalendarDaysData} />;
}

export function Check(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={CheckData} />;
}

export function CheckCircle2(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={CheckCircle2Data} />;
}

export function ChevronDown(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ChevronDownData} />;
}

export function ChevronLeft(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ChevronLeftData} />;
}

export function ChevronRight(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ChevronRightData} />;
}

export function Circle(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={CircleData} />;
}

export function CircleCheck(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={CircleCheckData} />;
}

export function CircleHelp(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={CircleHelpData} />;
}

export function Clock3(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={Clock3Data} />;
}

export function Code2(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={Code2Data} />;
}

export function Copy(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={CopyData} />;
}

export function Crown(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={CrownData} />;
}

export function DoorOpen(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={DoorOpenData} />;
}

export function Download(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={DownloadData} />;
}

export function Eraser(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={EraserData} />;
}

export function Eye(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={EyeData} />;
}

export function FileText(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={FileTextData} />;
}

export function GitCompareArrows(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={GitCompareArrowsData} />;
}

export function Globe2(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={Globe2Data} />;
}

export function Hand(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={HandData} />;
}

export function Heading2(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={Heading2Data} />;
}

export function HelpCircle(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={HelpCircleData} />;
}

export function Highlighter(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={HighlighterData} />;
}

export function History(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={HistoryData} />;
}

export function House(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={HouseData} />;
}

export function ImagePlus(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ImagePlusData} />;
}

export function Italic(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ItalicData} />;
}

export function KeyRound(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={KeyRoundData} />;
}

export function Layers3(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={Layers3Data} />;
}

export function LibraryBig(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={LibraryBigData} />;
}

export function List(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ListData} />;
}

export function ListOrdered(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ListOrderedData} />;
}

export function LockKeyhole(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={LockKeyholeData} />;
}

export function LogOut(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={LogOutData} />;
}

export function Mail(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={MailData} />;
}

export function Maximize2(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={Maximize2Data} />;
}

export function MessageCircleQuestion(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={MessageCircleQuestionData} />;
}

export function MessageSquare(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={MessageSquareData} />;
}

export function Minus(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={MinusData} />;
}

export function MoreHorizontal(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={MoreHorizontalData} />;
}

export function MousePointer2(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={MousePointer2Data} />;
}

export function PanelLeft(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={PanelLeftData} />;
}

export function PanelRightClose(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={PanelRightCloseData} />;
}

export function PanelsTopLeft(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={PanelsTopLeftData} />;
}

export function PenTool(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={PenToolData} />;
}

export function Pencil(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={PencilData} />;
}

export function Plus(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={PlusData} />;
}

export function Presentation(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={PresentationData} />;
}

export function Quote(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={QuoteData} />;
}

export function Radio(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={RadioData} />;
}

export function Redo2(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={Redo2Data} />;
}

export function RefreshCw(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={RefreshCwData} />;
}

export function RemoveFormatting(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={RemoveFormattingData} />;
}

export function RotateCcw(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={RotateCcwData} />;
}

export function Route(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={RouteData} />;
}

export function Save(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={SaveData} />;
}

export function SendHorizontal(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={SendHorizontalData} />;
}

export function Settings(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={SettingsData} />;
}

export function Settings2(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={Settings2Data} />;
}

export function ShieldAlert(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ShieldAlertData} />;
}

export function ShieldCheck(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ShieldCheckData} />;
}

export function Sparkles(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={SparklesData} />;
}

export function Split(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={SplitData} />;
}

export function Square(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={SquareData} />;
}

export function StickyNote(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={StickyNoteData} />;
}

export function Strikethrough(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={StrikethroughData} />;
}

export function Trash2(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={Trash2Data} />;
}

export function TriangleAlert(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={TriangleAlertData} />;
}

export function Type(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={TypeData} />;
}

export function Undo2(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={Undo2Data} />;
}

export function Upload(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={UploadData} />;
}

export function UserMinus(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={UserMinusData} />;
}

export function UserPlus(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={UserPlusData} />;
}

export function UserRound(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={UserRoundData} />;
}

export function UsersRound(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={UsersRoundData} />;
}

export function X(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={XData} />;
}

export function ZoomIn(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ZoomInData} />;
}

export function ZoomOut(props: IconProps): React.ReactElement {
  return <AppIcon {...props} iconData={ZoomOutData} />;
}
