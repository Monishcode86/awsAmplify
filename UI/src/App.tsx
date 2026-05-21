import { useState, useEffect, useRef } from "react";
import {
  Authenticator,
  Button,
  Text,
  TextField,
  Heading,
  Flex,
  View,
  Image,
  Grid,
  Divider,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { getUrl } from "aws-amplify/storage";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import outputs from "../../amplify_outputs.json";

/**
 * @type {import('aws-amplify/data').Client<import('../amplify/data/resource').Schema>}
 */

Amplify.configure(outputs);

export default function App() {
  const clientRef = useRef<any>(null);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = generateClient({
        authMode: "userPool",
      });
    }
    fetchNotes();
  }, []);

  async function fetchNotes() {
    if (!clientRef.current) return;
    const response = await clientRef.current.models.Note.list();
    const notes = response?.data || [];
    await Promise.all(
      notes.map(async (note: any) => {
        if (note.image) {
          try {
            const linkToStorageFile = await getUrl({
              path: ({ identityId }: any) => `media/${identityId}/${note.image}`,
            });
            note.image = linkToStorageFile?.url ?? note.image;
          } catch (e) {
            console.warn("Failed to get storage URL:", e);
          }
        }
        return note;
      })
    );
    setNotes(notes);
  }

  async function createNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const imageFile = form.get("image") as File | null;
    console.log(imageFile?.name);

    const { data: newNote } = await clientRef.current.models.Note.create({
      name: String(form.get("name") || ""),
      description: String(form.get("description") || ""),
      image: imageFile?.name ?? null,
    });

    console.log(newNote);
    if (newNote?.image && imageFile) {
      try {
        await uploadData({
          path: ({ identityId }: any) => `media/${identityId}/${newNote.image}`,
          data: imageFile,
        });
      } catch (e) {
        console.warn("Upload failed:", e);
      }
    }

    await fetchNotes();
    (event.currentTarget as HTMLFormElement).reset();
  }

  async function deleteNote({ id }: any) {
    const toBeDeletedNote = {
      id: id,
    };

    const { data: deletedNote } = await clientRef.current.models.Note.delete(
      toBeDeletedNote
    );
    console.log(deletedNote);

    fetchNotes();
  }

  return (
    <Authenticator>
      {({ signOut }: { signOut: () => void }) => (
        <Flex
          className="App"
          justifyContent="center"
          alignItems="center"
          direction="column"
          width="70%"
          margin="0 auto"
        >
          <Heading level={1}>My Notes App</Heading>
          <View as="form" margin="3rem 0" onSubmit={createNote}>
            <Flex
              direction="column"
              justifyContent="center"
              gap="2rem"
              padding="2rem"
            >
              <TextField
                name="name"
                placeholder="Note Name"
                label="Note Name"
                labelHidden
                variation="quiet"
                required
              />
              <TextField
                name="description"
                placeholder="Note Description"
                label="Note Description"
                labelHidden
                variation="quiet"
                required
              />
              <View
                name="image"
                as="input"
                type="file"
                alignSelf={"end"}
                accept="image/png, image/jpeg"
              />

              <Button type="submit" variation="primary">
                Create Note
              </Button>
            </Flex>
          </View>
          <Divider />
          <Heading level={2}>Current Notes</Heading>
          <Grid
            margin="3rem 0"
            autoFlow="column"
            justifyContent="center"
            gap="2rem"
            alignContent="center"
          >
            {notes.map((note) => (
              <Flex
                key={note.id || note.name}
                direction="column"
                justifyContent="center"
                alignItems="center"
                gap="2rem"
                border="1px solid #ccc"
                padding="2rem"
                borderRadius="5%"
                className="box"
              >
                <View>
                  <Heading level={3}>{note.name}</Heading>
                </View>
                <Text fontStyle="italic">{note.description}</Text>
                {note.image && (
                  <Image
                    src={note.image}
                    alt={`visual aid for ${note.name}`}
                    style={{ width: 400 }}
                  />
                )}
                <Button
                  variation="destructive"
                  onClick={() => deleteNote(note)}
                >
                  Delete note
                </Button>
              </Flex>
            ))}
          </Grid>
          <Button onClick={signOut}>Sign Out</Button>
        </Flex>
      )}
    </Authenticator>
  );
}
