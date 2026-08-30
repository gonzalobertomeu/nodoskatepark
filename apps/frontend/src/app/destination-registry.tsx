import type { ReactNode } from 'react';
import { SectionInPreparation } from '../components/app-shell/SectionInPreparation';
import { StaffDestinationPanel } from '../components/app-shell/StaffDestinationPanel';
import { ClassSchedulePanel } from '../components/class-schedule/ClassSchedulePanel';
import { InstructorAssignmentView } from '../components/InstructorAssignmentView';
import { SettingsView } from '../components/SettingsView';
import { SkaterBasicInfoForm } from '../components/SkaterBasicInfoForm';
import { SkaterListView } from '../components/SkaterListView';
import { SkaterProfileView } from '../components/SkaterProfileView';
import type { Destination, DestinationId, NestedSurface } from './navigation-map';

/**
 * Maps a destination or nested surface to the component that fills its panel.
 *
 * Kept apart from `navigation-map.ts` on purpose: the map is data — role sets, labels, order — and
 * stays free of React so it can be tested on its own. This is where that data meets the views.
 *
 * The views are adopted unmodified from the features that own them (002-staff-skater-directory,
 * 003-instructor-role-assignment, 004-skater-onboarding, 005-staff-directory). This feature
 * organises them into an information architecture; it does not touch their data logic.
 */

const DESTINATION_PANELS: Partial<Record<DestinationId, () => ReactNode>> = {
  // Skater
  profile: () => <SkaterBasicInfoForm mode="edit" />,
  settings: () => <SettingsView />,
  // Staff
  skaters: () => <SkaterListView />,
  staff: () => <StaffDestinationPanel />,
  schedule: () => <ClassSchedulePanel />,
  // `bookings` is intentionally absent: its feature has not been specified yet, so it renders the
  // explicit in-preparation state below (FR-025).
};

const NESTED_PANELS: Record<string, () => ReactNode> = {
  '/skaters/profile': () => <SkaterProfileView />,
  '/staff/instructors': () => <InstructorAssignmentView />,
};

export function renderDestination(destination: Destination): ReactNode {
  // A destination whose feature is not built yet says so explicitly and never fails (FR-025,
  // FR-026). The same fallback covers one whose panel is not wired: the honest "in preparation"
  // state always beats a blank panel or a crash.
  if (destination.status === 'in-preparation') {
    return <SectionInPreparation label={destination.label} />;
  }
  const render = DESTINATION_PANELS[destination.id];
  return render ? render() : <SectionInPreparation label={destination.label} />;
}

export function renderNested(surface: NestedSurface): ReactNode {
  const render = NESTED_PANELS[surface.path];
  return render ? render() : <SectionInPreparation label={surface.title} />;
}
