import {
    autoPlacement,
    offset,
    shift,
    useFloating,
} from "@floating-ui/react-dom-interactions";
import { Plus } from "@styled-icons/boxicons-regular";
import { observer } from "mobx-react-lite";
import { Message } from "revolt.js";
import styled, { css } from "styled-components";

import { createPortal } from "preact/compat";
import { useCallback, useRef, useState } from "preact/hooks";

import { IconButton } from "@revoltchat/ui";

import { emojiDictionary } from "../../../../assets/emojis";
import { useClient } from "../../../../controllers/client/ClientController";
import { RenderEmoji } from "../../../markdown/plugins/emoji";
import { HackAlertThisFileWillBeReplaced } from "../MessageBox";

interface Props {
    message: Message;
}

/**
 * Reaction list element
 */
const List = styled.div`
    gap: 0.4em;
    display: flex;
    flex-wrap: wrap;
    margin-top: 0.2em;
    align-items: center;

    .add {
        display: none;
    }

    &:hover .add {
        display: grid;
    }
`;

/**
 * List divider
 */
const Divider = styled.div`
    width: 1px;
    height: 14px;
    background: var(--tertiary-foreground);
`;

/**
 * Reaction styling
 */
const Reaction = styled.div<{ active: boolean }>`
    padding: 0.4em;
    cursor: pointer;
    user-select: none;
    vertical-align: middle;
    border: 1px solid transparent;
    color: var(--secondary-foreground);
    border-radius: var(--border-radius);
    background: var(--secondary-background);

    img {
        width: 1.2em;
        height: 1.2em;
        object-fit: contain;
    }

    &:hover {
        filter: brightness(0.9);
    }

    &:active {
        filter: brightness(0.75);
    }

    ${(props) =>
        props.active &&
        css`
            border-color: var(--accent);
        `}
`;

/**
 * Tooltip for usernames
 */
const UsernameTooltip = styled.div`
    display: none;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px;
    background-color: var(--tertiary-background);
    color: var(--secondary-foreground);
    border-radius: 4px;
    font-size: 0.8em;
    white-space: nowrap;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);

    &:before {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        border-width: 5px;
        border-style: solid;
        border-color: var(--tertiary-background) transparent transparent transparent;
        transform: translateX(-50%);
    }
`;

const ReactionContainer = styled.div`
    position: relative;
    display: inline-block;

    &:hover ${UsernameTooltip} {
        display: block;
    }
`;

/**
 * Render reactions on a message
 */
export const Reactions = observer(({ message }) => {
    const client = useClient();
    const [showPicker, setPicker] = useState(false);

    /**
     * Render individual reaction entries
     */
    const Entry = useCallback(
        observer(({ id, user_ids }) => {
            const active = user_ids?.has(client.user!._id) || false;

            return (
                <ReactionContainer>
                    {/* Tooltip with usernames */}
                    <UsernameTooltip>
                        {Array.from(user_ids || []).map(userId => {
                            const user = client.users.get(userId);
                            return <div key={userId}>{user?.username}</div>;
                        })}
                    </UsernameTooltip>

                    {/* Render reaction emoji and count */}
                    <Reaction
                        active={active}
                        onClick={() =>
                            active ? message.unreact(id) : message.react(id)
                        }>
                        <RenderEmoji match={id} /> {user_ids?.size || 0}
                    </Reaction>
                </ReactionContainer>
            );
        }),
        [client.user],
    );

    /**
     * Determine two lists of 'required' and 'optional' reactions
     */
    const { required, optional } = (() => {
        const required = new Set<string>();
        const optional = new Set<string>();

        if (message.interactions?.reactions) {
            for (const reaction of message.interactions.reactions) {
                required.add(reaction);
            }
        }

        for (const key of message.reactions.keys()) {
            if (!required.has(key)) {
                optional.add(key);
            }
        }

        return {
            required,
            optional,
        };
    })();

    // Don't render list if nothing is going to show anyways
    if (required.size === 0 && optional.size === 0) return null;

    return (
        <List>
            {Array.from(required, (id) => (
                <Entry key={id} id={id} user_ids={message.reactions.get(id)} />
            ))}
            {required.size !== 0 && optional.size !== 0 && <Divider />}
            {Array.from(optional, (id) => (
                <Entry key={id} id={id} user_ids={message.reactions.get(id)} />
            ))}
            {message.channel?.havePermission("React") && (
                <ReactionWrapper
                    message={message}
                    open={showPicker}
                    setOpen={setPicker}>
                    <IconButton className={showPicker ? "" : "add"}>
                        <Plus size={20} />
                    </IconButton>
                </ReactionWrapper>
            )}
        </List>
    );
});

const Base = styled.div`
    > div {
        position: unset;
    }
`;

/**
 * ! FIXME: rewrite
 */
export const ReactionWrapper: React.FC<{
    message: Message;
    open: boolean;
    setOpen: (v: boolean) => void;
}> = ({ open, setOpen, message, children }) => {
    const { x, y, reference, floating, strategy } = useFloating({
        open,
        middleware: [
            offset(4),
            shift({ mainAxis: true, crossAxis: true, padding: 4 }),
            autoPlacement(),
        ],
    });

    const skip = useRef();
    const toggle = () => {
        if (skip.current) {
            skip.current = null;
            return;
        }

        setOpen(!open);

        if (!open) {
            skip.current = true;
        }
    };

    return (
        <>
            <div
                ref={reference}
                onClick={toggle}
                style={{ width: "fit-content" }}>
                {children}
            </div>

            {createPortal(
                <div id="reaction">
                    {open && (
                        <Base
                            ref={floating}
                            style={{
                                position: strategy,
                                top: y ?? 0,
                                left: x ?? 0,
                            }}>
                            <HackAlertThisFileWillBeReplaced
                                onSelect={(emoji) =>
                                    message.react(
                                        emojiDictionary[
                                            emoji as keyof typeof emojiDictionary
                                        ] ?? emoji,
                                    )
                                }
                                onClose={toggle}
                            />
                        </Base>
                    )}
                </div>,
                document.body,
            )}
        </>
    );
};