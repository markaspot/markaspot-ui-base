/**
 * Single-source helper for picking the locationAddress that lands in
 * field_address on a service request submission.
 *
 * Both citizen report form variants need the same rule, and the
 * rule has tripped reviewers up twice: in optional/mixed/disabled facility
 * modes, the citizen's pin-derived address must NOT be shadowed by the
 * facility's stored street, even if a facility id auto-attached via
 * spatial proximity. The FacilityManager backend deliberately leaves geo
 * data alone in those modes (see
 * profiles/contrib/markaspot/modules/markaspot_facility/src/Service/FacilityManager.php
 * applyToServiceRequest), so the frontend must mirror that.
 *
 * Only `exclusive` mode lets the facility own the location/address; in
 * every other mode (optional, mixed, disabled) the citizen's reverse-
 * geocoded address wins unconditionally.
 */
import type { FacilityAddress } from '~~/types/clientConfig';
import type { GeocodingAddress } from '@/utils/mapAddressToDrupal';

export interface PickLocationFacility {
    address?: FacilityAddress | string
}

export type PickedLocationAddress = FacilityAddress | GeocodingAddress | string | undefined;

export function pickLocationAddress(
    isExclusive: boolean,
    selectedFacility: PickLocationFacility | null | undefined,
    locationAddress: PickedLocationAddress
): PickedLocationAddress {
    return isExclusive
        ? (selectedFacility?.address ?? locationAddress)
        : locationAddress;
}
