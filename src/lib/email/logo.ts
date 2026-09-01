/**
 * Le logo de l'enseigne, embarque dans le message.
 *
 * Il etait jusqu'ici charge depuis l'application, par son adresse publique. La
 * plupart des messageries bloquent les images distantes tant que le
 * destinataire ne les autorise pas : le logo apparaissait chez les uns,
 * manquait chez les autres, et parfois d'un message a l'autre dans la meme
 * boite. Un en-tete qui change de forme selon le jour ne ressemble a rien.
 *
 * Il voyage donc avec le courriel, en piece jointe inline referencee par
 * `cid:` — la seule methode que les messageries honorent toutes. Une image en
 * `data:` serait ignoree par Gmail et Outlook.
 *
 * Cinquante-six pixels de cote pour vingt-huit affiches : de quoi rester net
 * sur un ecran dense, pour deux kilo-octets.
 */

/** Identifiant de la piece jointe, cite par le HTML sous la forme `cid:logo`. */
export const LOGO_CID = "logo";

const LOGO_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAYAAACohjseAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA" +
  "6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAeGVYSWZNTQAqAAAACAAEARoABQAAAAEAAAA+ARsABQAAAAEAAABGASgAAwAAAAEA" +
  "AgAAh2kABAAAAAEAAABOAAAAAAAAAEgAAAABAAAASAAAAAEAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAOKADAAQAAAABAAAA" +
  "OAAAAAA+2FxkAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4" +
  "bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9" +
  "Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJk" +
  "ZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iPgogICAgICAg" +
  "ICA8eG1wOkNyZWF0b3JUb29sPkZpZ21hPC94bXA6Q3JlYXRvclRvb2w+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8" +
  "L3JkZjpSREY+CjwveDp4bXBtZXRhPgoE/1zIAAAGyklEQVRoBe2aW0hVWRjHP4+apV3opun0EoVd7K72kNBT96IcC4fAIYjs" +
  "yRRnqIcoDCUlLLvfo8KXSmqyBxHmvbciKLToflGn6CUqLLXLrN+Ctdie8XT2bp/jdMQFh709e+21v9/6f9+3vrU9caJadnZ2" +
  "4rdv335Vn7q4uLhf1JGvY64p20XZ3qaOf6rPtVu3bvXETZkyJWn48OH18fHxhYDFKpxRA0g+X758aejp6fk9YeTIkfnqi8Kv" +
  "X7+aPjF9NCIhWCAQ+Ct+woQJfyuiETFNFcJ4BZsXUOplxLpb9sUHk2JLDwxEOAMMW8D8MVCPg4Cxruyggj+rgm6TY8woCNDn" +
  "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";

/** La piece jointe inline a passer a Resend, telle quelle. */
export function pieceLogo() {
  return {
    filename: "logo.png",
    content: LOGO_BASE64,
    content_id: LOGO_CID,
    content_type: "image/png",
  };
}
