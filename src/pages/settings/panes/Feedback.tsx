import { Github } from "@styled-icons/boxicons-logos";
import { BugAlt, Group, ListOl } from "@styled-icons/boxicons-regular";
import { Link } from "react-router-dom";

import styles from "./Panes.module.scss";
import { Text } from "preact-i18n";

import { CategoryButton, Column, Tip } from "@revoltchat/ui";

export function Feedback() {
    return (
        <Column>
            <div className={styles.feedback}>
                <Link to="/invite/TdtQBdC7">
                    <a>
                        <CategoryButton
                            action="chevron"
                            icon={<Group size={24} />}
                            description="You can talk with the community and report issues here, official guild.">
                            {"Join the Match3D Lounge"}
                        </CategoryButton>
                    </a>
                </Link>
            </div>
        </Column>
    );
}
