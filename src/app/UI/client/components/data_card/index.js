
import { themr } from "react-css-themr";
import { DATA_CARD } from "../identifiers";
import theme from "./theme.scss";

import RevisionCard from "./RevisionCard";
import JobCard from "./JobCard";
import CommentCard from "./CommentCard";
import AddCommentCard from "./AddCommentCard";

const ThemedRevisionCard = themr(DATA_CARD, theme)(RevisionCard);
const ThemedJobCard = themr(DATA_CARD, theme)(JobCard);
const ThemedCommentCard = themr(DATA_CARD, theme)(CommentCard);
const ThemedAddCommentCard = themr(DATA_CARD, theme)(AddCommentCard);

export { ThemedRevisionCard as RevisionCard };
export { ThemedJobCard as JobCard };
export { ThemedCommentCard as CommentCard };
export { ThemedAddCommentCard as AddCommentCard };
