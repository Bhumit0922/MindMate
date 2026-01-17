interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <>
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">{children}</div>
      </div>
    </>
  );
};

export default Layout;

// the file is to use all the things under auth the master file is known as layout file it apply to all the parent folder
// () folder this like (auth) this will group the things and tell nextjs to ignore it
