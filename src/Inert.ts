import Component, { IContainer } from "./Component";
import IMain from "./IMain";

/**
 * Base class for passive components.
 *
 * A base class for component types that don't affect rendering,
 * most notably Comment, but also unknown components in general.
 */
export default abstract class Inert extends Component {
    protected opts: any;

    /*tslint:disable:no-empty*/
    public init() {}
    public draw() {
        throw new Error("Calling draw on inert component.");
    }
}
